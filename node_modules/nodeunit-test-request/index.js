"use strict";

module.exports = function testRequest(test, server, req, tests)
{
    req.on('response', function(res)
    {
        res.on('error', function(error)
        {
            console.log('test response emitted error: ', error, error.stack);
            throw error;
        });

        res.on('end', function()
        {
            if (Array.isArray(server))
            {
                var callbacks = [];
                for (var i = 0; i < (server.length - 1); i++)
                {
                    callbacks[i] = (function()
                    {
                        var index = i;
                        return function()
                        {
                            server[index + 1].close(callbacks[index + 1]);
                        }
                    })();
                }
                callbacks[server.length - 1] = function()
                {
                    test.done();
                };
                server[0].close(callbacks[0]);
                return;
            }
            server.close(function()
            {
                test.done();
            });
        });

        tests(res);
    });

    req.on('error', function(error)
    {
        console.log('test request emitted error: ', error);
        throw error;
    });
};
