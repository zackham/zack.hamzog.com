require 'io/console'
require 'json'


def decrypt
  return 
  files = Dir.glob("posts/*.enc")
  puts "Ready to decrypt #{files.size} files: #{files.join(", ")}"
  print "enter aes-256-cbc encryption password: " 
  pass = STDIN.noecho(&:gets).strip
  puts
  files.each do |infile|
    outfile = infile.gsub(/\.enc$/, ".c.md")
    `openssl enc -aes-256-cbc -in #{infile} -out #{outfile} -pass pass:"#{pass}" -d -base64`
    system "head #{outfile}"
  end
  puts "DONE."
end

def index_files(files)
  sections = {}
  files.each do |file|
    title, date, section = nil
    File.open(file) do |f|
      title = f.readline.strip
      date = f.readline.strip
      section = f.readline.strip
    end
    sections[section] ||= []
    sections[section] << {
      title: title,
      date: date,
      file: file
    }
  end
  # sort by date desc
  sections.each{|k, v| sections[k].sort!{|a,b| b[:date] <=> a[:date]}}
  sections
end

def request_pass(for_s, verify=true)
  puts
  print "Password for #{for_s}: "
  pass = STDIN.noecho(&:gets).strip
  puts
  print "Verify: "
  pass2 = STDIN.noecho(&:gets).strip
  puts
  if pass != pass2
    puts "Passwords do not match."
    exit
  end
  pass
end

def encrypt(x, pass)
  IO.popen('openssl enc -aes-256-cbc -pass pass:"test" -e -base64', 'r+') do |io| 
    io.write(x)
    io.close_write 
    io.read 
  end
end

def index
  decrypt
  open_sections = index_files(Dir.glob("posts/*"))
  locked = []
  dec_sections = index_files(Dir.glob("posts_dec/*"))
  dec_sections.each do |section, posts|
    pass = request_pass(section)
    # encrypt posts
    enc_posts = []
    posts.each do |post|
      enc_post = {
        title: post[:title],
        date: post[:date],
        file: "posts_enc/" + `md5 #{post[:file]}`.gsub(/.* /,'').strip
      }
      File.open(enc_post[:file], 'w') {|f| f.write encrypt(File.read(post[:file]), pass)}
      enc_posts << enc_post
    end
    locked << encrypt({
      section: section,
      posts: enc_posts
    }.to_json, pass)
  end

  index_json = {
    sections: open_sections,
    locked: locked
  }.to_json
  File.open("posts.js", 'w') {|f| f.write "var doolittleIndex = #{index_json}"}

  puts "DONE"
  puts "posts.js written."
end


args = ARGV.map(&:strip)
case args[0]
when /^d/ then decrypt
else 
  index
end
