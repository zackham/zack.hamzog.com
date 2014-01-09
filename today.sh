file="posts_dec/`date +"%Y-%m-%d"`.md"
if [ ! -f $file ]; then
  read title
  echo $title > $file
  echo "`date +"%Y-%m-%d"`" >> $file
  echo "misc" >> $file
  echo "" >> $file
  echo "cool deal" >> $file
  ruby blog.rb
fi
vim $file
