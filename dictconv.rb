# coding: utf-8
#
# GyaimMotionで使ってる辞書ファイル(dict.txt)をJSに変換
#
# GyaimMotionでは起動時に変換しているが、遅そうなのであらかじめ変換しておく
#

class DictEntry
  attr_reader :pat, :word, :inConnection, :outConnection
  attr_accessor :keyLink, :connectionLink

  def initialize(pat,word,inConnection,outConnection)
    @pat = pat
    @word = word
    @inConnection = inConnection
    @outConnection = outConnection
    @keyLink = nil
    @connectionLink = nil
  end
end

dict = []

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
puts "var keyLink = [];"
cur = []
dict.each_with_index { |entry,i|
  next if entry.word =~ /^\*/
  # ind = entry.pat[0]
  ind = entry.pat.ord # 1.9
  if keyLink[ind].nil? then
    cur[ind] = i
    keyLink[ind] = i
    puts "keyLink[#{ind}] = #{i};"
  else
    dict[cur[ind]].keyLink = i
    cur[ind] = i
  end
  entry.keyLink = "null"# リンクの末尾
}

#
# コネクションつながりのリスト
#
puts
puts "var connectionLink = [];"
cur = []
dict.each_with_index { |entry,i|
  ind = entry.inConnection
  if connectionLink[ind].nil? then
    cur[ind] = i
    connectionLink[ind] = i
    puts "connectionLink[#{ind}] = #{i};"
  else
    dict[cur[ind]].connectionLink = i
    cur[ind] = i
  end
  entry.connectionLink = "null" # リンクの末尾
}

puts
puts "const dictData = ["
dict.each_with_index { |entry,i|
  comma = (i == dict.length-1 ? "" : ",")
  puts "  [\"#{entry.pat}\", \"#{entry.word}\", #{entry.inConnection}, #{entry.outConnection}, #{entry.keyLink}, #{entry.connectionLink}]#{comma}"
}
puts "];"


