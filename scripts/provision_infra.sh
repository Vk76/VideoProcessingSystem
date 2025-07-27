#!/bin/bash

# AWS Infrastructure Provisioning Script
# This script creates EC2 instance, S3 bucket, and necessary security groups

set -e  # Exit on any error
export AWS_PROFILE=my-dev-profile

echo "🚀 Starting AWS infrastructure provisioning..."

# Configuration
REGION="ap-south-1"
INSTANCE_TYPE="t3.small"
KEY_NAME="video-processing-key"
SECURITY_GROUP_NAME="video-processing-sg"
S3_BUCKET="video-processing-system-bucket"
IAM_ROLE_NAME="VideoProcessingEC2Role"

# Generate unique S3 bucket name (commented out - using static name now)
# TIMESTAMP=$(date +%s)
# S3_BUCKET="${S3_BUCKET_PREFIX}-${TIMESTAMP}"

echo "📝 Configuration:"
echo "  Region: $REGION"
echo "  Instance Type: $INSTANCE_TYPE"
echo "  S3 Bucket: $S3_BUCKET"

# Create S3 bucket (only if it doesn't exist)
echo "🪣 Checking/Creating S3 bucket: $S3_BUCKET"
if aws s3api head-bucket --bucket $S3_BUCKET --region $REGION 2>/dev/null; then
    echo "✅ S3 bucket '$S3_BUCKET' already exists"
else
    echo "🔧 Creating new S3 bucket: $S3_BUCKET"
    aws s3 mb s3://$S3_BUCKET --region $REGION
    
    # Enable versioning on S3 bucket
    aws s3api put-bucket-versioning \
        --bucket $S3_BUCKET \
        --versioning-configuration Status=Enabled
    
    echo "✅ S3 bucket created successfully"
fi

# Create or check key pair
echo "🔑 Creating/checking key pair: $KEY_NAME"
if aws ec2 describe-key-pairs --key-names $KEY_NAME --region $REGION >/dev/null 2>&1; then
    echo "✅ Key pair '$KEY_NAME' already exists"
else
    echo "🔧 Attempting to create new key pair: $KEY_NAME"
    # Try to create the key pair and save the private key
    if aws ec2 create-key-pair \
        --key-name $KEY_NAME \
        --region $REGION \
        --query 'KeyMaterial' \
        --output text > ~/.ssh/$KEY_NAME.pem 2>/dev/null; then
        
        # Set proper permissions for the private key
        chmod 400 ~/.ssh/$KEY_NAME.pem
        
        echo "✅ Key pair created and saved to ~/.ssh/$KEY_NAME.pem"
        echo "🔒 Private key permissions set to 400"
    else
        echo "❌ Failed to create key pair due to insufficient permissions"
        echo "📝 Available key pairs in your account:"
        aws ec2 describe-key-pairs --region $REGION --query 'KeyPairs[*].KeyName' --output text | tr '\t' '\n' | head -10
        echo ""
        echo "💡 Please update KEY_NAME in the script to use one of the existing key pairs above"
        exit 1
    fi
fi

# Create security group
echo "🔒 Creating security group: $SECURITY_GROUP_NAME"
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name $SECURITY_GROUP_NAME \
    --description "Security group for video processing system" \
    --region $REGION \
    --query 'GroupId' \
    --output text 2>/dev/null) || \
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
    --group-names $SECURITY_GROUP_NAME \
    --region $REGION \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null)

if [ -z "$SECURITY_GROUP_ID" ]; then
    echo "❌ Failed to create or find security group"
    exit 1
fi

# Add security group rules
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region $REGION \
    --no-paginate 2>/dev/null || echo "SSH rule may already exist"

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 5001 \
    --cidr 0.0.0.0/0 \
    --region $REGION \
    --no-paginate 2>/dev/null || echo "Port 5001 rule may already exist"

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 3000 \
    --cidr 0.0.0.0/0 \
    --region $REGION \
    --no-paginate 2>/dev/null || echo "Port 3000 rule may already exist"

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 9090 \
    --cidr 0.0.0.0/0 \
    --region $REGION \
    --no-paginate 2>/dev/null || echo "Port 9090 rule may already exist"

echo "✅ Security group created: $SECURITY_GROUP_ID"

# Create IAM role for EC2 (if it doesn't exist)
echo "👤 Creating/checking IAM role: $IAM_ROLE_NAME"

# Check if role already exists
if aws iam get-role --role-name $IAM_ROLE_NAME --region $REGION >/dev/null 2>&1; then
    echo "✅ IAM role '$IAM_ROLE_NAME' already exists"
else
    echo "🔧 Creating new IAM role: $IAM_ROLE_NAME"
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
        --region $REGION || echo "Role creation failed but may already exist"
fi

# Attach S3 access policy (if not already attached)
echo "🔗 Attaching S3 access policy to role..."
aws iam attach-role-policy \
    --role-name $IAM_ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess \
    --region $REGION 2>/dev/null || echo "Policy may already be attached"

# Create instance profile (if it doesn't exist)
echo "📋 Creating/checking instance profile..."
if aws iam get-instance-profile --instance-profile-name $IAM_ROLE_NAME --region $REGION >/dev/null 2>&1; then
    echo "✅ Instance profile '$IAM_ROLE_NAME' already exists"
else
    echo "🔧 Creating new instance profile: $IAM_ROLE_NAME"
    aws iam create-instance-profile \
        --instance-profile-name $IAM_ROLE_NAME \
        --region $REGION || echo "Instance profile creation failed but may already exist"
fi

# Add role to instance profile (if not already added)
echo "🔗 Adding role to instance profile..."
aws iam add-role-to-instance-profile \
    --instance-profile-name $IAM_ROLE_NAME \
    --role-name $IAM_ROLE_NAME \
    --region $REGION 2>/dev/null || echo "Role may already be added or insufficient permissions"

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

# Check if EC2 instance already exists
echo "🔍 Checking for existing EC2 instance..."
EXISTING_INSTANCE_ID=$(aws ec2 describe-instances \
    --region $REGION \
    --filters "Name=tag:Name,Values=VideoProcessingSystem" "Name=instance-state-name,Values=running,pending,stopping,stopped" \
    --query 'Reservations[*].Instances[*].InstanceId' \
    --output text 2>/dev/null)

if [ ! -z "$EXISTING_INSTANCE_ID" ]; then
    echo "✅ EC2 instance already exists: $EXISTING_INSTANCE_ID"
    INSTANCE_ID=$EXISTING_INSTANCE_ID
    
    # Get the current state
    INSTANCE_STATE=$(aws ec2 describe-instances \
        --instance-ids $INSTANCE_ID \
        --region $REGION \
        --query 'Reservations[0].Instances[0].State.Name' \
        --output text)
    
    echo "📊 Instance state: $INSTANCE_STATE"
    
    if [ "$INSTANCE_STATE" = "stopped" ]; then
        echo "🔄 Starting stopped instance..."
        aws ec2 start-instances --instance-ids $INSTANCE_ID --region $REGION
        echo "⏳ Waiting for instance to be running..."
        aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION
    elif [ "$INSTANCE_STATE" = "running" ]; then
        echo "✅ Instance is already running"
    else
        echo "⏳ Waiting for instance to be running..."
        aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION
    fi
else
    # Launch EC2 instance
    echo "🖥️ Launching new EC2 instance..."
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
fi

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

# Clean up temporary files
rm -f trust-policy.json
unset AWS_PROFILE


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
