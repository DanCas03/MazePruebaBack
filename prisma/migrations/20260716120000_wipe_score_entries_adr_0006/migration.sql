-- ADR 0006: la fórmula multiplicativa es incomparable con la aditiva previa;
-- los scores viejos fosilizarían el ranking. Los niveles se regeneran aparte.
DELETE FROM "ScoreEntry";
