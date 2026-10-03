-- Migration: Recalculate Historical ELO and Fix Match Formats
-- Description: Updates legacy matches with multiple players per team to 'doubles' and provides a deterministic recalculation function that replays all matches chronologically to rebuild player ratings and match_players snapshots.

-- 1. Format Alignment: Any match with >1 player on either team is doubles
UPDATE public.matches
SET match_format = 'doubles'
WHERE id IN (
    SELECT match_id 
    FROM public.match_players 
    GROUP BY match_id, team_side 
    HAVING COUNT(*) > 1
);

-- 2. Recalculation Engine Function
CREATE OR REPLACE FUNCTION public.recalculate_all_elo()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    m RECORD;
    t1_count INTEGER;
    t2_count INTEGER;
    t1_avg NUMERIC;
    t2_avg NUMERIC;
    exp1 NUMERIC;
    exp2 NUMERIC;
    act1 NUMERIC;
    act2 NUMERIC;
    delta1 NUMERIC;
    delta2 NUMERIC;
    p_item RECORD;
    cur_rating NUMERIC;
    new_rating NUMERIC;
BEGIN
    -- Reset all players to baseline
    UPDATE public.players
    SET 
        singles_rating = 1200.00,
        doubles_rating = 1200.00,
        rating = 1200.00,
        singles_matches_played = 0,
        singles_wins = 0,
        singles_losses = 0,
        doubles_matches_played = 0,
        doubles_wins = 0,
        doubles_losses = 0;

    -- Clear snapshots on match_players
    UPDATE public.match_players
    SET 
        rating_before = NULL,
        rating_after = NULL;

    -- Chronologically replay all completed matches
    FOR m IN 
        SELECT id, match_format, team_1_score, team_2_score, played_at, created_at
        FROM public.matches
        WHERE team_1_score IS NOT NULL AND team_2_score IS NOT NULL
        ORDER BY played_at ASC, created_at ASC
    LOOP
        -- Calculate team 1 average rating
        SELECT 
            COUNT(*),
            COALESCE(
                AVG(
                    CASE 
                        WHEN m.match_format = 'doubles' THEN COALESCE(p.doubles_rating, 1200.00)
                        ELSE COALESCE(p.singles_rating, 1200.00)
                    END
                ),
                1200.00
            )
        INTO t1_count, t1_avg
        FROM public.match_players t1_mp
        LEFT JOIN public.players p ON t1_mp.player_id = p.id
        WHERE t1_mp.match_id = m.id AND t1_mp.team_side = 'team_1';

        -- Calculate team 2 average rating
        SELECT 
            COUNT(*),
            COALESCE(
                AVG(
                    CASE 
                        WHEN m.match_format = 'doubles' THEN COALESCE(p.doubles_rating, 1200.00)
                        ELSE COALESCE(p.singles_rating, 1200.00)
                    END
                ),
                1200.00
            )
        INTO t2_count, t2_avg
        FROM public.match_players t2_mp
        LEFT JOIN public.players p ON t2_mp.player_id = p.id
        WHERE t2_mp.match_id = m.id AND t2_mp.team_side = 'team_2';

        IF t1_count = 0 THEN t1_avg := 1200.00; END IF;
        IF t2_count = 0 THEN t2_avg := 1200.00; END IF;

        t1_avg := ROUND(t1_avg, 2);
        t2_avg := ROUND(t2_avg, 2);

        exp1 := 1.0 / (1.0 + POWER(10.0, (t2_avg - t1_avg) / 400.0));
        exp2 := 1.0 / (1.0 + POWER(10.0, (t1_avg - t2_avg) / 400.0));

        IF m.team_1_score > m.team_2_score THEN
            act1 := 1.0;
            act2 := 0.0;
        ELSIF m.team_1_score < m.team_2_score THEN
            act1 := 0.0;
            act2 := 1.0;
        ELSE
            act1 := 0.5;
            act2 := 0.5;
        END IF;

        delta1 := ROUND(32.0 * (act1 - exp1));
        delta2 := ROUND(32.0 * (act2 - exp2));

        -- Update Team 1 players
        FOR p_item IN 
            SELECT pmp.id, pmp.player_id
            FROM public.match_players pmp
            WHERE pmp.match_id = m.id AND pmp.team_side = 'team_1'
        LOOP
            IF p_item.player_id IS NOT NULL THEN
                IF m.match_format = 'doubles' THEN
                    SELECT doubles_rating INTO cur_rating FROM public.players WHERE id = p_item.player_id;
                    cur_rating := COALESCE(cur_rating, 1200.00);
                    new_rating := cur_rating + delta1;

                    UPDATE public.match_players
                    SET rating_before = cur_rating, rating_after = new_rating
                    WHERE id = p_item.id;

                    UPDATE public.players
                    SET 
                        doubles_rating = new_rating,
                        doubles_matches_played = doubles_matches_played + 1,
                        doubles_wins = doubles_wins + (CASE WHEN act1 = 1.0 THEN 1 ELSE 0 END),
                        doubles_losses = doubles_losses + (CASE WHEN act1 = 0.0 THEN 1 ELSE 0 END)
                    WHERE id = p_item.player_id;
                ELSE
                    SELECT singles_rating INTO cur_rating FROM public.players WHERE id = p_item.player_id;
                    cur_rating := COALESCE(cur_rating, 1200.00);
                    new_rating := cur_rating + delta1;

                    UPDATE public.match_players
                    SET rating_before = cur_rating, rating_after = new_rating
                    WHERE id = p_item.id;

                    UPDATE public.players
                    SET 
                        singles_rating = new_rating,
                        rating = new_rating,
                        singles_matches_played = singles_matches_played + 1,
                        singles_wins = singles_wins + (CASE WHEN act1 = 1.0 THEN 1 ELSE 0 END),
                        singles_losses = singles_losses + (CASE WHEN act1 = 0.0 THEN 1 ELSE 0 END)
                    WHERE id = p_item.player_id;
                END IF;
            END IF;
        END LOOP;

        -- Update Team 2 players
        FOR p_item IN 
            SELECT pmp.id, pmp.player_id
            FROM public.match_players pmp
            WHERE pmp.match_id = m.id AND pmp.team_side = 'team_2'
        LOOP
            IF p_item.player_id IS NOT NULL THEN
                IF m.match_format = 'doubles' THEN
                    SELECT doubles_rating INTO cur_rating FROM public.players WHERE id = p_item.player_id;
                    cur_rating := COALESCE(cur_rating, 1200.00);
                    new_rating := cur_rating + delta2;

                    UPDATE public.match_players
                    SET rating_before = cur_rating, rating_after = new_rating
                    WHERE id = p_item.id;

                    UPDATE public.players
                    SET 
                        doubles_rating = new_rating,
                        doubles_matches_played = doubles_matches_played + 1,
                        doubles_wins = doubles_wins + (CASE WHEN act2 = 1.0 THEN 1 ELSE 0 END),
                        doubles_losses = doubles_losses + (CASE WHEN act2 = 0.0 THEN 1 ELSE 0 END)
                    WHERE id = p_item.player_id;
                ELSE
                    SELECT singles_rating INTO cur_rating FROM public.players WHERE id = p_item.player_id;
                    cur_rating := COALESCE(cur_rating, 1200.00);
                    new_rating := cur_rating + delta2;

                    UPDATE public.match_players
                    SET rating_before = cur_rating, rating_after = new_rating
                    WHERE id = p_item.id;

                    UPDATE public.players
                    SET 
                        singles_rating = new_rating,
                        rating = new_rating,
                        singles_matches_played = singles_matches_played + 1,
                        singles_wins = singles_wins + (CASE WHEN act2 = 1.0 THEN 1 ELSE 0 END),
                        singles_losses = singles_losses + (CASE WHEN act2 = 0.0 THEN 1 ELSE 0 END)
                    WHERE id = p_item.player_id;
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END;
$$;

-- Grant permissions to execute function
GRANT EXECUTE ON FUNCTION public.recalculate_all_elo() TO anon, authenticated, service_role;

-- 3. Execute recalculation immediately
SELECT public.recalculate_all_elo();
