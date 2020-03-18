pwd
ls -al
printenv
cd /home/ubuntu/api
ls -al
sudo apt-get install -y build-essential python
sudo npm install
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/home/ubuntu/cloudwatch-agent-config.json -s