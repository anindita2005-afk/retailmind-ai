exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "RetailMind AI running on AWS Lambda 🚀"
    })
  };
};