require 'io/console'


def encrypt
  files = Dir.glob("posts/*.c.md")
  puts "Ready to encrypt #{files.size} files: #{files.join(", ")}"
  print "enter aes-256-cbc encryption password: " 
  pass = STDIN.noecho(&:gets).strip
  puts
  print "Verifying - enter aes-256-cbc encryption password: " 
  pass2 = STDIN.noecho(&:gets).strip
  puts
  if pass != pass2
    puts "Passwords do not match."
    exit
  end
  files.each do |infile|
    outfile = infile.gsub(/\.c\.md$/, ".enc")
    `openssl enc -aes-256-cbc -in #{infile} -out #{outfile} -pass pass:"#{pass}" -e -base64`
  end
  puts "DONE. Check in browser to make sure it works."
  print "Delete decrypted versions? [y/N] "
  if STDIN.gets =~ /y/ 
    files.each do |file|
      `rm #{file}`
    end
    puts "Deleted."
  else
    puts "NOT deleting"
  end
end


def decrypt
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

def index
  if Dir.glob("posts/*.c.md").any?
    puts "There are some .c.md files that need to be deleted. Run blog.rb encrypt."
    exit
  end
  files = Dir.glob("posts/*.enc") + Dir.glob("posts/*.md")
  js = %(var blogFiles = [#{files.map{|f| %("#{f.gsub('posts/','')}")}.join(",\n")}];)
  File.open("posts.js", "w") {|f| f.write(js) }
  puts "DONE"
  puts "posts.js written."
end


args = ARGV.map(&:strip)
case args[0]
when /^e/ then encrypt
when /^d/ then decrypt
when /^i/ then index
else 
  puts "usage: ruby blog.rb encrypt | decrypt | index"
end
