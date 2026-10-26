#!/usr/bin/env bash
set -o errexit

python manage.py migrate

python manage.py create_deploy_user

python manage.py collectstatic --noinput