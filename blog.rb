require 'io/console'
require 'json'


def decrypt_all
  return true if !File.exists?("posts.js")
  x = JSON.parse(File.read("posts.js").gsub(/^.*? = /, ''))
  while x["locked"].size > 0
    puts "#{x["locked"].size} remaining."
    pass = request_pass("any locked section", false)
    still_locked = []
    x["locked"].each do |locked|
      unlocked = begin
                   JSON.parse(decrypt(locked, pass))
                 rescue
                   still_locked << locked
                   next
                 end
      unlocked["posts"].each do |post|
        File.open(post["orig_file"], 'w') {|f|
          puts "Writing #{post["orig_file"]}"
          f.write(decrypt(File.read(post["file"]), pass))
        }
      end
    end
    x["locked"] = still_locked
  end
  puts "Done decrypting"
  true
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
  if verify
    print "Verify: "
    pass2 = STDIN.noecho(&:gets).strip
    puts
    if pass != pass2
      puts "Passwords do not match."
      exit
    end
  end
  pass
end

def decrypt(x, pass)
  IO.popen("openssl enc -aes-256-cbc -pass pass:\"#{pass}\" -d -base64", 'r+') do |io| 
    io.write(x)
    io.close_write 
    io.read 
  end
end

def encrypt(x, pass)
  IO.popen("openssl enc -aes-256-cbc -pass pass:\"#{pass}\" -e -base64", 'r+') do |io| 
    io.write(x)
    io.close_write 
    io.read 
  end
end

def index
  print "Delete decrypted posts? y/[N]: "
  keep_dec = STDIN.gets !~ /y/
  exit unless decrypt_all
  `rm posts_enc/*`

  open_section_files = Dir.glob("posts/*")
  open_section_files += Dir.glob("posts_dec/*") if keep_dec
  open_sections = index_files(open_section_files)
  locked = []
  unless keep_dec
    dec_sections = index_files(Dir.glob("posts_dec/*"))
    dec_sections.each do |section, posts|
      pass = request_pass("section #{section}")
      # encrypt posts
      enc_posts = []
      posts.each do |post|
        enc_post = {
          title: post[:title],
          date: post[:date],
          file: "posts_enc/" + `md5 #{post[:file]}`.gsub(/.* /,'').strip,
          orig_file: post[:file]
        }
        File.open(enc_post[:file], 'w') {|f| f.write encrypt(File.read(post[:file]), pass)}
        enc_posts << enc_post
      end
      locked << encrypt({
        section: section,
        posts: enc_posts
      }.to_json, pass)
    end
  end

  index_json = {
    sections: open_sections,
    locked: locked
  }.to_json
  File.open("posts.js", 'w') {|f| f.write "var doolittleIndex = #{index_json}"}

  puts "DONE"
  puts "posts.js written."
  unless keep_dec
    `rm posts_dec/*`
    puts "DELETED posts_dec/*"
  end
end


args = ARGV.map(&:strip)
case args[0]
when /^d/ then decrypt
else 
  index
end
