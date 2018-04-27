dict = []

ARGF.each_with_index { |line,i|
  next if i == 0
  line = line.chomp.force_encoding('utf-8')
  next if line =~ /^\s*$/
  next if line =~ /\s*#/
  dict << line.split(/\t/)
}

puts "const webdict = ["
dict.each_with_index { |e,i|
  print "  [\"#{e[0]}\", \"#{e[1]}\"]"
  print "," if i < dict.length-1
  puts
}
puts "];"


