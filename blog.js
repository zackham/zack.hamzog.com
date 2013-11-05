(function() {
  var sectionTemplate = _.template($("#sectionTemplate").html());
  var postTemplate = _.template($("#postTemplate").html());
  var postsByFile, allPosts;
  var passphrases = {};
  var postQueue = [];
  var queueRunning = false;

  window.addEventListener("hashchange", renderContent);
  $("#passphrase").on("keypress", function(e) { 
    if(e.which == 13) {
      tryPass($("#passphrase").val()); 
      $('#passphrase').val('');
    }
  }).focus();
  renderBlog();

  function renderBlog() {
    parseIndex();
    renderContent();
  }


  function parseIndex() {
    postsByFile = {};
    allPosts = [];
    _.each(doolittleIndex.sections, function(posts, section) {
      _.each(posts, function(post) {
        post.section = section;
        post.dateFormatted = parseDate(new Date(post.date + " 00:00"));
        allPosts.push(post);
        postsByFile[post.file] = post;
      });
    });
    allPosts.sort(postSortingFn);
  }
  function postSortingFn(a, b) { return a.date < b.date; }
  function parseDate(date) {
    return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();

  }


  function renderSections(activeSection) {
    $("#sections").html(sectionTemplate({href: '', name: "All posts", selected: activeSection === "All posts"}));
    _.each(doolittleIndex.sections, function(posts, section) {
      $("#sections").append(sectionTemplate({
        selected: activeSection === section,
        name: section,
        href: "s=" + escape(section)
      }));
    });
  }

  function renderContent() {
    $('#posts').empty();
    var hash = window.location.hash;
    if(hash.indexOf("f=") != "-1") {
      var file = hash.substr(hash.indexOf("=") + 1);
      renderSections();
      appendPost(postsByFile[file]);
    } else {
      if(hash.indexOf("s=") != "-1") {
        var section = hash.substr(hash.indexOf("=") + 1);
        renderSection(section);
      } else {
        renderAll();
      }
    }
  }

  function renderAll() {
    renderSections("All posts");
    _.each(allPosts, function(post) {
      appendPost(post);
    });
  }

  function renderSection(section) {
    renderSections(section);
    _.each(doolittleIndex.sections[section], function(post) {
      appendPost(post);
    });
  }

  function onPostReady(post) {
    appendCachedPost(post);
    if(postQueue.length > 0) 
      (postQueue.shift())();
    else
      queueRunning = false;
  }
  function appendPostTask(post, xhr) {
    return function() {
      if(xhr) {
        xhr.done(function(raw) {
          if(post.encrypted) 
            raw = decrypt(raw, passphrases[post.section]);
          post.content = parsePostContent(raw);
          onPostReady(post);
        });
      } else
        onPostReady(post);
    };
  }
  function runQueue() {
    if(!queueRunning) {
      queueRunning = true;
      (postQueue.shift())();
    }
  }
  function appendPost(post) {
    if(post.content) 
      postQueue.push(appendPostTask(post));
    else
      postQueue.push(appendPostTask(post, $.get(post.file)));
    runQueue();
  }

  function appendCachedPost(post) {
    $("#posts").append(postTemplate(post));
  }

  marked.setOptions({
    highlight: function(code, lang) {
      return hljs.highlight(lang, code).value;
    }
  });
  function parsePostContent(raw) {
    var i = raw.indexOf("\n\n"),
        body = raw.substr(i+2);
    return marked(body);
  }


  function tryPass(pass) {
    var stillLocked = [];
    _.each(doolittleIndex.locked, function(x) {
      try {
        var unlocked = JSON.parse(decrypt(x, pass));
        mergeUnlockedSection(unlocked);
        passphrases[unlocked.section] = pass;
      } catch(e) {
        stillLocked.push(x);
      }
    });
    if(stillLocked.length < doolittleIndex.locked.length) {
      doolittleIndex.locked = stillLocked;
      renderBlog();
    }
  }
  function mergeUnlockedSection(unlocked) {
    _.each(unlocked.posts, function(post) { post.encrypted = true; });
    if(doolittleIndex.sections[unlocked.section]) {
      _.each(unlocked.posts, function(post) {
        doolittleIndex.sections[unlocked.section].posts.push(post);
      });
      doolittleIndex.sections[unlocked.section].posts.sort(postSortingFn);
    } else {
      doolittleIndex.sections[unlocked.section] = unlocked.posts;
    }
  }

  function decrypt(x, passphrase) {
    return CryptoJS.AES.decrypt(x.replace(/\n/g,''), passphrase).toString(CryptoJS.enc.Utf8);
  }
})();
