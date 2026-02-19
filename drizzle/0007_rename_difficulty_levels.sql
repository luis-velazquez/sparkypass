-- Migrate difficulty values from easy/medium/hard to apprentice/journeyman/master
UPDATE quiz_results SET difficulty = 'apprentice' WHERE difficulty = 'easy';
UPDATE quiz_results SET difficulty = 'journeyman' WHERE difficulty = 'medium';
UPDATE quiz_results SET difficulty = 'master' WHERE difficulty = 'hard';

-- Rename the show_hints column
ALTER TABLE users RENAME COLUMN show_hints_on_hard TO show_hints_on_master;
