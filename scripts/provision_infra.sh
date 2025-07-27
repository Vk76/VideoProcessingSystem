#!/bin/bash

# AWS Infrastructure Provisioning Script
# This script creates EC2 instance, S3 bucket, and necessary security groups

set -e  # Exit on any error

echo "🚀 Starting AWS infrastructure provisioning..."

# Configuration
REGION="us-east-1"
INSTANCE_TYPE="t3.medium"
KEY_NAME="video-processing-key"
SECURITY_GROUP_NAME="video-processing-sg"
S3_BUCKET_PREFIX="video-processing-system"
IAM_ROLE_NAME="VideoProcessingEC2Role"

# Generate unique S3 bucket name
TIMESTAMP=$(date +%s)
S3_BUCKET="${S3_BUCKET_PREFIX}-${TIMESTAMP}"

echo "📝 Configuration:"
echo "  Region: $REGION"
echo "  Instance Type: $INSTANCE_TYPE"
echo "  S3 Bucket: $S3_BUCKET"

# Create S3 bucket
echo "🪣 Creating S3 bucket: $S3_BUCKET"
aws s3 mb s3://$S3_BUCKET --region $REGION

# Enable versioning on S3 bucket
aws s3api put-bucket-versioning \
    --bucket $S3_BUCKET \
    --versioning-configuration Status=Enabled

echo "✅ S3 bucket created successfully"

# Create security group
echo "🔒 Creating security group: $SECURITY_GROUP_NAME"
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name $SECURITY_GROUP_NAME \
    --description "Security group for video processing system" \
    --region $REGION \
    --query 'GroupId' \
    --output text)

# Add security group rules
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region $REGION

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 5001 \
    --cidr 0.0.0.0/0 \
    --region $REGION

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 3000 \
    --cidr 0.0.0.0/0 \
    --region $REGION

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 9090 \
    --cidr 0.0.0.0/0 \
    --region $REGION

echo "✅ Security group created: $SECURITY_GROUP_ID"

# Create IAM role for EC2 (if it doesn't exist)
echo "👤 Creating IAM role: $IAM_ROLE_NAME"
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
    --role-name $IAM_ROLE_NAME \
    --assume-role-policy-document file://trust-policy.json \
    --region $REGION || echo "Role may already exist"

# Attach S3 access policy
aws iam attach-role-policy \
    --role-name $IAM_ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess \
    --region $REGION || echo "Policy may already be attached"

# Create instance profile
aws iam create-instance-profile \
    --instance-profile-name $IAM_ROLE_NAME \
    --region $REGION || echo "Instance profile may already exist"

aws iam add-role-to-instance-profile \
    --instance-profile-name $IAM_ROLE_NAME \
    --role-name $IAM_ROLE_NAME \
    --region $REGION || echo "Role may already be added"

echo "✅ IAM role created"

# Get latest Amazon Linux 2 AMI
echo "🔍 Finding latest Amazon Linux 2 AMI..."
AMI_ID=$(aws ec2 describe-images \
    --owners amazon \
    --filters "Name=name,Values=amzn2-ami-hvm-*-x86_64-gp2" \
    --query 'Images[*].[ImageId,CreationDate]' \
    --output text \
    --region $REGION | sort -k2 -r | head -n1 | cut -f1)

echo "📡 Using AMI: $AMI_ID"

# Launch EC2 instance
echo "🖥️ Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    --iam-instance-profile Name=$IAM_ROLE_NAME \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=VideoProcessingSystem}]' \
    --region $REGION \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "⏳ Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

# Clean up temporary files
rm -f trust-policy.json

echo ""
echo "🎉 Infrastructure provisioned successfully!"
echo ""
echo "📋 Summary:"
echo "  Instance ID: $INSTANCE_ID"
echo "  Public IP: $PUBLIC_IP"
echo "  S3 Bucket: $S3_BUCKET"
echo "  Security Group: $SECURITY_GROUP_ID"
echo ""
echo "📝 Save these details for your .env file:"
echo "S3_BUCKET=$S3_BUCKET"
echo ""
echo "🔧 Next steps:"
echo "1. SSH to your instance: ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP"
echo "2. Clone your repository on the instance"
echo "3. Set up your .env file with the S3_BUCKET value above"
echo "4. Run the deploy script"
echo ""
