pwd
ls -al

cd /home/ubuntu
pwd
printenv
ls -al
pm2 start ./api/ecosystem.config.js --env production
pm2 list