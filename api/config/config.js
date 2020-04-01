require('dotenv').config(); //instatiate environment variables

let CONFIG = {}; //Make this global to use all over the application

CONFIG.app = process.env.NODE_ENV;
CONFIG.port = process.env.PORT;

CONFIG.db_dialect = process.env.DB_DIALECT;
CONFIG.db_host = process.env.DB_HOST;
CONFIG.db_port = process.env.DB_PORT;
CONFIG.db_name = process.env.DB_NAME;
CONFIG.db_user = process.env.DB_USER;
CONFIG.db_password = process.env.DB_PSWD;

CONFIG.file_upload_path = process.env.FILE_UPLOAD_PATH
CONFIG.s3_bucket = process.env.S3_BUCKET
CONFIG.aws_region = process.env.AWS_REGION
CONFIG.domain_name = process.env.DOMAIN_NAME
CONFIG.sqs_queue_name = process.env.SQS_QUEUE_URL
CONFIG.sns_topic_arn = process.env.SNS_TOPIC_ARN

module.exports = CONFIG;