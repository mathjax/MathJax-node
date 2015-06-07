== How to generate tests ==

... to be written ...
```
                    var fs = require('fs');
                    fs.writeFile("/vagrant/srv/test", JSON.stringify(res), function(err) {
                        if(err) {
                            return console.log(err);
                        }
                        console.log("The file was saved!");
                    });
```

In .jsignore lib is ignored. That should be changed in the future