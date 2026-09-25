# Execution locks

The `live` branch stores one exclusive lock file per active task: `locks/<task-id>.json`. Presence of an unexpired valid lock is the execution authority. Never use this README file as a lock.
