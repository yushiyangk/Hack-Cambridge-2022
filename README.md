## Running

# API server

In `api/`, run
```
export FLASK_APP=api
export FLASK_ENV=
flask run
```

For testing, run
```
export FLASK_APP=api
export FLASK_ENV=development
flask run
```

# Frontend server

In `web/`, run
```
python -m http.server
```

(or replace `python` with `python3` if necessary; `http.server` should come built-in with Python 3)
