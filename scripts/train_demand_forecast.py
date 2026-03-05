import boto3
import sagemaker
from sagemaker.xgboost.estimator import XGBoost
from sagemaker.inputs import TrainingInput

# 1. Initialize AWS SageMaker Session
# Note: You should run this in an AWS SageMaker Notebook instance or locally with AWS credentials configured.
sagemaker_session = sagemaker.Session()
role = sagemaker.get_execution_role()  # Your AWS IAM role that has SageMaker training permissions
bucket = sagemaker_session.default_bucket()

prefix = 'retailmind-ai/demand-forecasting'

print(f"Training Data will be saved to s3://{bucket}/{prefix}")

# 2. Prepare Data (Imagine you've aggregated CSV data from your Next.js app's PostgreSQL DB)
# Feature Columns Expected: [sales_last_week, current_stock, avg_local_temp, is_festival, competitor_price_delta]
# Target Column: actual_sales_next_week

train_data_uri = f's3://{bucket}/{prefix}/train/retail_train_data.csv'
val_data_uri = f's3://{bucket}/{prefix}/validation/retail_val_data.csv'

s3_input_train = TrainingInput(train_data_uri, content_type='csv')
s3_input_val = TrainingInput(val_data_uri, content_type='csv')

# 3. Create SageMaker XGBoost Estimator
# We are using SageMaker's built-in managed XGBoost container for high performance numeric regression
xgboost_container = sagemaker.image_uris.retrieve("xgboost", boto3.Session().region_name, "1.7-1")

xgb_estimator = sagemaker.estimator.Estimator(
    image_uri=xgboost_container,
    role=role,
    instance_count=1,
    instance_type='ml.m5.xlarge', # Cost effective compute type for medium tabular datasets
    output_path=f's3://{bucket}/{prefix}/output', # Where to save the trained custom model
    sagemaker_session=sagemaker_session
)

# 4. Set Hyperparameters (Fine-tuned for Indian Retail Seasonal Swings)
xgb_estimator.set_hyperparameters(
    max_depth=5,              # How complex local logic trees get (e.g. Temperature -> Festival -> Stock)
    eta=0.2,                  # Learning rate
    gamma=4,
    min_child_weight=6,
    subsample=0.8,
    objective='reg:squarederror', # Regression because we want to forecast exact stock units
    num_round=100
)

# 5. Kick off Remote Training
print("Starting RetailMind Demand Model Training on AWS infrastructure...")
xgb_estimator.fit({'train': s3_input_train, 'validation': s3_input_val})

# 6. Deploy the Model as a Live REST Endpoint
print("Deploying Live API Endpoint for Next.js...")
predictor = xgb_estimator.deploy(
    initial_instance_count=1,
    instance_type='ml.m5.large', # Live inference server
    endpoint_name='retailiq-xgboost-demand-v1' # Your Next.js app hits THIS endpoint
)

print(f"Success! Model deployed at: {predictor.endpoint_name}")
print("Update your Next.js `.env` with: SG_DEMAND_FORECAST_ENDPOINT=retailiq-xgboost-demand-v1")
