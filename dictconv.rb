# coding: utf-8
#
# Convert a dict for GyaimMotion to dictdata.js
#

# dictfile = "dict.txt"

class DictEntry
  attr_reader :pat, :word, :inConnection, :outConnection
  attr_accessor :keyLink, :connectionLink

  def initialize(pat,word,inConnection,outConnection)
    @pat = pat
    @word = word
    @inConnection = inConnection
    @outConnection = outConnection
    @keylink = nil
    @connectionLink = nil
  end
end

dict = []

#File.open(dictfile){ |f|
#  f.each { |line|

ARGF.each { |line|
  line = line.force_encoding('utf-8').chomp
  next if line =~ /^#/
  next if line =~ /^\s/
  a = line.split(/\t/)
  a[3] = 0 if a[3].nil? || a[3] == ""
  a[2] = a[2].to_i
  dict << DictEntry.new(a[0],a[1],a[2].to_i,a[3].to_i)
}

keyLink = []
connectionLink = []
# initLink()
#
# 先頭読みが同じ単語のリスト
#
cur = []
dict.each_with_index { |entry,i|
  next if entry.word =~ /^\*/
  # ind = entry.pat[0]
  ind = entry.pat.ord # 1.9
  if keyLink[ind].nil? then
    cur[ind] = i
    keyLink[ind] = i
  else
    dict[cur[ind]].keyLink = i
    cur[ind] = i
  end
  entry.keyLink = "null"# リンクの末尾
}
#
# コネクションつながりのリスト
#
cur = []
dict.each_with_index { |entry,i|
  ind = entry.inConnection
  if connectionLink[ind].nil? then
    cur[ind] = i
    connectionLink[ind] = i
  else
    dict[cur[ind]].connectionLink = i
    cur[ind] = i
  end
  entry.connectionLink = "null" # リンクの末尾
}

puts "const dict = ["
dict.each { |entry|
  puts "  [\"#{entry.pat}\", \"#{entry.word}\", #{entry.inConnection}, #{entry.outConnection}, #{entry.keyLink}, #{entry.connectionLink}],"
}
puts "  [\"\", \"\", 0, 0, null, null]"
puts "];"


