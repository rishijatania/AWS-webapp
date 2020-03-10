pwd
ls -al

cd /home/ubuntu
pwd
printenv
ls -al
# sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/home/centos/cloudwatch-agent-config.json -s
pm2 start ./api/ecosystem.config.js --env production
pm2 list