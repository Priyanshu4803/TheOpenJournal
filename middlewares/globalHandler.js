const globalErrHandler = (err, req, res, next) => {
    //status : failed/something
    //message
    //stack
  
    const stack = err.stack;
    const message = err.message;
    const status = err.status ? err.status : "failed";
    const statusCode = err.statusCode ? err.statusCode : 500;
    // const statusCode = 900;
  
    //send response
    res.status(statusCode).json({
      message,
      status,
      stack,
    });
  };
  
  module.exports = globalErrHandler;
  