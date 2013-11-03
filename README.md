# doolittle

Simple static blog supporting private posts.

## Design goals

* Password-protected content on a static site.
* Write posts in markdown.
* Category support.
* Post permalinks.
* Easy to set up and use. 

## Examples

2 public posts and 1 private post included in posts/ directory. Just load up index.html in your browser to see how it works. Enter `pass` in the text box in the topnav and press `enter` to decrypt the private post.

## Posting

Create a new file in posts/. Use .md extension for public posts, use .c.md extension for private posts.

Posts are formatted like this:

```
Title of post
Date of post in YYYY-MM-DD format
Post category

Post body in markdown.
```

## Private posts

Private posts are encrypted with the openssl binary using 256bit aes.

Make sure your private posts have extension .c.md.

Run `ruby blog.rb encrypt`, follow instructions. foo.c.md is encrypted into foo.enc.

If you want to edit your posts later, run `ruby blog.rb decrypt` and you'll get the .c.md files back.

## Building posts index

Run `ruby blog.rb index` to build `posts.js` which contains a listing of all posts. Only filenames are included, no additional post content or metadata currently.

## How it works

All the posts from `posts.js` are loaded via XHR, the markdown is parsed client-side. Encrypted posts are ignored. If you enter a passphrase in the navbar encrypted posts are loaded, decrypted, and shown. 

## What it uses

* Layout: [bootstrap](http://getbootstrap.com/)
* Syntax highlighting: [highlight.js](http://highlightjs.org/)
* Decryption: [CryptoJS](https://code.google.com/p/crypto-js/)
* Markdown parsing: [marked](https://github.com/chjj/marked)
* Other deps: [jQuery](http://jquery.com/), [underscore](http://underscorejs.org/)

## But... [Javascript Cryptography Considered Harmful](http://www.matasano.com/articles/javascript-cryptography/)

Honestly I would have been happy with HTTP basic auth, but that didn't meet my req of being static & zero-configuration - I just don't want all my posts public by default. The encryption doesn't happen in the browser though so the evil-doers will have to catch me decrypting my posts to snag my passphrase. 

## TODO

* Sort articles before building the `posts.js` index and implement pagination.
