(function() {

  window.addEventListener("hashchange", renderContent);
  $("#passphrase").on("keypress", function(e) { if(e.which == 13) tryPass($("#passphrase").val()); });

  function renderBlog() {
    parseIndex();
    renderSections();


  }

  var postsByFile, allPosts;

  function parseIndex() {
    postsByFile = {};
    allPosts = [];
    _.each(doolittleIndex.sections, function(posts, section) {
      _.each(posts, function(post) {
        allPosts.push(post);
        postsByFile[post.file] = post;
      });
    });
  }

  var sectionTemplate = _.template($("#sectionTemplate").html());
  function renderSections() {
    $("#sections").html(sectionTemplate({href: '', name: "All posts", selected: false}));
    _.each(doolittleIndex.sections, function(posts, section) {
      var selected = false;
      $("#sections").append(sectionTemplate({
        selected: selected,
        name: section,
        href: "s=" + escape(section)
      }));
    });
  }

  function renderContent() {
    var hash = window.location.hash;
    if(hash.indexOf("f=") != "-1") {
      var file = hash.substr(hash.indexOf("=") + 1);
      appendFile(file);
    } else {
      var section;
      if(hash.indexOf("s=") != "-1") {
        var section = hash.substr(hash.indexOf("=") + 1);
        renderSection(section);
      } else {
        renderAll();
      }
    }
  }

  function renderAll() {

  }

  var toFetch = [], fileCache = {};
  function appendFile(file) {
    if(toFetch.length === 0) {
    toFetch.push(file);

  }

  function renderSection(section) {

  }

  function tryPass(pass) {
  }

  function decrypt(x, passphrase) {
    return CryptoJS.AES.decrypt(x.replace(/\n/g,''), passphrase).toString(CryptoJS.enc.Utf8);
  }

  var articles, remaining = 0, fileCache = {}, passphrase, section, sections, articleView, passphrases={};

  function decryptIndex(passphrase) {
    console.log("do it");
    _.each(doolittleIndex.locked, function(x) {
        console.log("trying with", passphrase, x);
        console.log(x.replace(/\n/g,''))
        var unlocked = JSON.parse(decrypt(x, passphrase));
        doolittleIndex.sections[unlocked.section] = unlocked.posts;
        passphrases[unlocked.section] = passphrase;
    });
  }

  function parseIndex() {
    _.each(doolittleIndex.sections, function(posts, section) {
      _.each(posts, function(post) {
        renderFile(post.file);
      });
    });
  }

  function render() {
    articles = [];
    sections = [];
    articleView = false;
    // check hash for specific article
    var hash = window.location.hash;
    if(hash.indexOf("f=") != "-1") {
      articleView = true;
      var file = hash.substr(hash.indexOf("=") + 1);
      renderFile(file);
    } else {
      if(hash.indexOf("s=") != "-1") 
        section = hash.substr(hash.indexOf("=") + 1);
      else
        section = null;

      _.each(doolittleIndex.sections, function(posts, section) {
        _.each(posts, function(post) {
          renderFile(post.file);
        })
      });
    }
  }

  function renderFile(file) {
    remaining++;
    if(fileCache[file]) {
      setTimeout(function() {
        remaining--;
        addArticle(file, fileCache[file]);
      }, 0);
    } else {
      $.get(file, function(x) {
        remaining--;
        fileCache[file] = x;
        addArticle(file, x);
      });
    }
  }

  function addArticle(file, x) {
    if(file.indexOf(".enc") != -1)
      x = CryptoJS.AES.decrypt(x.replace(/\n/g,''), passphrase).toString(CryptoJS.enc.Utf8);

    var article = parseArticle(file, x);
    if(!section || article.section === section) 
      articles.push(parseArticle(file, x));

    if(!remaining) {
      sortAndRender();
    }
  }

  marked.setOptions({
    highlight: function(code, lang) {
      return hljs.highlight(lang, code).value;
    }
  });
  function parseArticle(file, x) {
    // first line is title, second line is section, third is date, then \n\n, then markdown body
    var i = x.indexOf("\n\n"),
        head = x.substr(0, i).split("\n"),
        body = x.substr(i+2),
        title = head[0],
        date = head[1],
        section = head[2],
        dateFormatted = parseDate(new Date(date + " 00:00"));
    
    if(sections.indexOf(section) === -1) {
      sections.push(section);
      sections.sort();
    }

    return {
      file: file,
      title: title,
      section: section,
      date: date,
      dateFormatted: dateFormatted,
      body: marked(body)
    };
  }
  function parseDate(date) {
    return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();

  }
  function sortAndRender() {
    window.asdf = articles
    articles.sort(function(a,b) { return a.date > b.date; });
    articles.reverse();
    $("#articles").empty();
    var articleTemplate = _.template($("#articleTemplate").html());
    articles.forEach(function(article) {
      $("#articles").append(articleTemplate(article));
    });

    var sectionTemplate = _.template($("#sectionTemplate").html());
    $("#sections").html(sectionTemplate({href: '', name: "All posts", selected: !section && !articleView}));
    sections.forEach(function(s) {
      var selected = section === s;
      $("#sections").append(sectionTemplate({
        selected: selected,
        name: s,
        href: "s=" + escape(s)
      }));
    });
  }
})();
