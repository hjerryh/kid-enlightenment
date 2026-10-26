"""Original Little World animal drawings, built from individually composed SVG anatomy.

Run with Python 3. Regenerates only the 56 additions; original six animals are untouched.
All illustrations are standalone, transparent, 240 × 240 and contain no external resources.
"""
from pathlib import Path
from xml.sax.saxutils import escape
import math

OUT=Path(__file__).resolve().parents[1]/'public'/'art'
INK='#394E43'; CREAM='#FFF4DB'
PALETTE={'fur':('#EABF8C','#C99464'),'gold':('#FFE396','#EDBE5A'),'fox':('#EEA76D','#D97E46'),'paper':('#FFFBED','#EEE1C4'),'grey':('#B1C6C8','#819FA3'),'brown':('#BD9876','#967350'),'dark':('#71817D','#465B56'),'leaf':('#89B38C','#477E62'),'green':('#A8C68B','#709E71'),'blue':('#A3C8D7','#6A9CAE'),'pink':('#EDADB0','#D78291'),'red':('#F48B73','#DF594C'),'purple':('#BAA2D0','#8C72B3')}
def path(d,fill='none',stroke=None,sw=2):
    return f'<path d="{d}" fill="{fill}"'+(f' stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"' if stroke else '')+'/>'
def ell(x,y,rx,ry,c,extra=''):return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{c}" {extra}/>'
def circ(x,y,r,c,extra=''):return ell(x,y,r,r,c,extra)
def rect(x,y,w,h,r,c):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{c}"/>'
def line(x,y,x2,y2,c=INK,w=3):return path(f'M{x} {y}L{x2} {y2}','none',c,w)
def group(s,t='',extra=''):return f'<g transform="{t}" {extra}>{s}</g>'
def eye(x,y,r=3.2):return ell(x,y,r,r*1.1,INK)+circ(x-.8,y-1,.9,'#FFF')
def grad(c):return f'url(#{c})'
def ground(y=211,rx=68):return ell(120,y,rx,6,'#52755B','opacity=".07"')
def defs():
    s='<defs>'
    for key,(a,b) in PALETTE.items():s+=f'<linearGradient id="{key}" x1="0" y1="0" x2=".75" y2="1"><stop stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>'
    return s+'<filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#394E43" flood-opacity=".09"/></filter></defs>'
CREATED=[]
def save(name,label,s,shadow=True):
    OUT.mkdir(parents=True,exist_ok=True)
    s=ground()+group(s,extra='filter="url(#shadow)"' if shadow else '')
    (OUT/f'{name}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240" role="img" aria-label="{escape(label)}"><title>{escape(label)}</title>{defs()}{s}</svg>\n')
    CREATED.append(name)
def muzzle(x,y,rx=19,ry=13):return ell(x,y,rx,ry,CREAM)+ell(x,y-4,5,3.5,INK)+path(f'M{x} {y}v5m0 0q-6 5 -11 0m11 0q6 5 11 0','none',INK,1.7)
def feet(xs,y,c,w=15,h=38):return ''.join(rect(x,y,w,h,6,c)+ell(x+w/2,y+h,w*.64,5,c) for x in xs)
def cheek(x,y):return ell(x,y,8,4,'#EFC6BA','opacity=".7"')
def beard():return path('M109 119L114 139L120 131L127 140L132 118Z',CREAM)

# Rat: long bare tail, round ears, pointed muzzle and small forepaws.
s=path('M162 173C207 191 230 164 210 145C196 131 191 148 202 151','none','#D6A39D',7)
s+=ell(126,156,48,45,grad('grey'))+ell(122,167,29,26,'#D8E0D5')+ell(93,199,20,8,'#D6A39D')+ell(151,199,20,8,'#D6A39D')
s+=circ(79,76,25,grad('grey'))+circ(159,76,25,grad('grey'))+circ(79,76,15,'#DDB2AE')+circ(159,76,15,'#DDB2AE')
s+=path('M73 98Q75 64 120 67Q164 67 169 98Q165 120 121 139Q80 121 73 98Z',grad('grey'))+eye(98,100)+eye(143,100)+ell(120,128,7,5,'#AE7E80')
for a,b,c,d in [(102,121,63,111),(103,128,66,134),(138,121,177,111),(138,128,175,135)]:s+=line(a,b,c,d,'#78918D',1.7)
s+=ell(99,157,8,13,'#D6A39D','transform="rotate(-25 99 157)"')+ell(144,157,8,13,'#D6A39D','transform="rotate(25 144 157)"')
save('rat','A grey rat with round ears, whiskers and a long bare pink tail',s)

# Ox: broad bovine muzzle, horns, four hooves and a tufted tail.
s=path('M181 120Q206 139 200 165','none','#987556',7)+ell(199,168,6,10,grad('dark'))+feet([96,155],153,'#937454',17,44)+ell(133,131,61,41,grad('brown'))+feet([79,143],154,grad('brown'),18,46)
s+=path('M62 81Q40 74 48 48Q53 68 77 65M114 70Q140 68 137 43Q153 72 128 87',CREAM,'#C5B58F',1.5)
s+=ell(54,93,17,9,grad('brown'),'transform="rotate(-25 54 93)"')+ell(139,90,16,9,grad('brown'),'transform="rotate(25 139 90)"')
s+=ell(96,102,37,43,grad('brown'))+eye(79,95)+eye(112,95)+ell(94,127,35,22,'#D8B39B')+ell(80,125,4,3,'#866450')+ell(108,125,4,3,'#866450')+path('M82 138Q95 145 108 137','none','#866450',2)
for x in [79,96,143,155]:s+=rect(x,193,18,9,3,'#657168')
save('ox','A brown ox with curved horns, a broad muzzle and four hooves',s)

# Tiger: feline face, bold stripes and a long striped tail.
s=path('M167 165C213 181 214 130 197 119','none','#D99A4C',16)+ell(122,160,46,41,grad('fox'))+ell(122,169,27,28,CREAM)+ell(91,199,22,10,grad('fox'))+ell(151,199,22,10,grad('fox'))
s+=circ(77,62,18,grad('fox'))+circ(163,62,18,grad('fox'))+circ(77,62,9,'#6C6250')+circ(163,62,9,'#6C6250')+ell(120,100,58,49,grad('fox'))+ell(99,118,23,18,CREAM)+ell(140,118,23,18,CREAM)+eye(96,97)+eye(146,97)+muzzle(121,117,19,14)
for d in ['M104 55L111 76L119 56','M128 55L128 76L139 58','M66 87L85 94L65 100','M67 109L84 112L72 121','M174 86L155 94L175 100','M172 109L156 113L170 123','M82 155L99 162L79 169','M163 155L146 164L165 172'] :s+=path(d,'#6B604B')
s+=path('M193 164L204 168M200 145L209 144M196 126L204 123','none','#6B604B',6)
save('tiger','An orange tiger with black stripes and a white muzzle',s)

# Chinese dragon: continuous coiled body, four legs, antlers and whiskers; no wings.
s=path('M191 174Q212 172 207 143Q201 129 191 145Q187 152 176 146','none','#5A9174',23)
s+=path('M70 105C46 115 47 150 77 154C101 156 120 124 146 133C180 144 177 184 143 192C110 201 97 179 77 181','none',grad('green'),37)
s+=path('M70 107C58 126 61 140 79 140C103 141 120 111 149 121C188 136 190 184 150 204','none','#D9DFA2',7)
for d in ['M60 123L42 117L49 139','M82 156L75 170L97 158','M126 125L125 108L142 119','M164 141L182 134L180 156','M164 188L176 202L154 202'] :s+=path(d,'#DAA75A')
for d in ['M78 133Q101 150 96 163L112 167M72 133Q61 154 51 157L46 167','M147 167Q127 168 126 181L112 186M161 168Q180 178 185 192L199 194'] :s+=path(d,'none','#6B9D74',10)
for x,y in [(112,167),(46,167),(112,186),(199,194)]:s+=path(f'M{x-6} {y-3}l-4 7m10 -7v8m5 -7l5 5','none','#E1C080',3)
s+=path('M66 69L52 47L55 29M55 46L41 39M102 68L114 44L112 26M113 43L128 34','none','#C39A68',7)
s+=path('M55 67L39 65L46 82M105 66L124 62L115 81','#7BAB7E')+ell(83,86,35,30,grad('leaf'))+ell(81,109,36,18,'#D5DDA3')+eye(67,86)+eye(98,85)+ell(68,106,4,3,INK)+ell(94,106,4,3,INK)
s+=path('M52 107Q26 91 25 111M111 106Q142 88 143 109','none','#CAA76A',3)+path('M67 117Q81 126 96 116','none',INK,2)+path('M81 55L70 43L90 47L96 38L101 59Z','#D2AB61')
save('dragon','A Chinese dragon with a long coiled body, four legs, antlers and whiskers',s)

s=ell(115,184,70,22,grad('green'))+path('M65 183C35 167 56 143 96 151C130 157 160 166 165 145C171 122 135 120 133 103C130 83 146 72 161 75','none',grad('leaf'),29)+ell(164,71,36,26,grad('green'))+eye(153,66)+eye(180,66)+path('M161 88L163 105M163 101L155 107M163 101L171 107','none','#CC8C80',2.7)+ell(105,181,44,8,'#CDDBAA')+path('M62 168Q78 156 96 164M128 149L142 134M139 106L154 101','none','#B2C48A',7)
save('snake','A green snake with a coiled limbless body and a forked tongue',s)

# Horse: long face, upright mane, flowing tail and four hooves.
s=path('M170 109Q205 101 203 154Q187 144 184 174Q178 154 180 127Z',grad('dark'))+feet([86,148],150,'#B48962',14,48)+ell(128,135,57,35,grad('fur'))+feet([74,159],148,grad('fur'),15,51)
s+=path('M79 143Q62 121 68 86L88 62L109 77L106 129Z',grad('fur'))+path('M84 66L90 53Q117 73 114 122L106 134Q102 94 92 76Z',grad('dark'))+path('M72 65L69 38L84 53L88 35L97 65Z',grad('fur'))
s+=path('M75 55Q98 49 103 71L96 99Q82 114 53 109Q41 105 45 90Z',grad('fur'))+ell(56,101,17,12,'#DEBE98')+eye(76,76)+circ(51,100,2.7,'#8A7258')
for x in [74,86,148,159]:s+=rect(x,194,16,9,3,INK)
save('horse','A chestnut horse with a long face, dark mane, flowing tail and hooves',s)

# Goat: slender horns, beard, cloven hooves and short raised tail.
s=path('M170 125L193 105L188 132Z',grad('paper'))+feet([101,153],151,'#CFC6AD',13,47)+ell(132,139,55,34,grad('paper'))+feet([88,164],152,grad('paper'),14,47)
s+=path('M72 74Q62 43 75 30Q73 55 85 68M103 72Q111 43 101 28Q124 49 115 80',grad('brown'))+path('M67 91L44 78Q38 101 65 106M119 91L142 80Q149 101 120 108',grad('paper'))
s+=path('M62 84Q94 60 124 85L115 124L94 141L72 125Z',grad('paper'))+path('M84 127L85 154L94 146L100 154L105 128Z',CREAM)+eye(79,99)+eye(109,99)+ell(94,120,16,11,'#DED1B4')+path('M88 121L94 125L100 121','none',INK,2)
for x in [88,101,153,164]:s+=rect(x,193,14,8,2,'#807D69')+line(x+7,199,x+7,194,CREAM,1)
save('goat','A cream goat with two slender horns, a beard and cloven hooves',s)

# Monkey: visible curled tail and grasping hands.
s=path('M161 170C209 207 228 142 196 129C176 122 171 145 187 149','none','#9E7851',14)+ell(121,159,38,43,grad('brown'))+ell(121,166,23,30,'#E3C398')+path('M91 145Q60 153 64 181M153 145Q178 151 178 181','none','#A4825C',16)+ell(64,184,12,9,'#E3C398')+ell(178,184,12,9,'#E3C398')+ell(92,200,23,9,'#E3C398')+ell(150,200,23,9,'#E3C398')+circ(67,93,20,grad('brown'))+circ(173,93,20,grad('brown'))+circ(67,94,11,'#E3C398')+circ(173,94,11,'#E3C398')+ell(120,89,51,48,grad('brown'))+path('M81 91C75 67 100 59 120 78C140 58 167 68 160 92Q172 127 120 137Q70 129 81 91Z','#F2D9B6')+eye(98,91)+eye(143,91)+ell(120,109,5,3.5,'#88674E')+path('M100 118Q120 133 141 117','none','#88674E',2.5)+path('M113 45Q108 31 123 33Q135 34 128 45','none','#9B7753',6)
save('monkey','A brown monkey with round ears, grasping hands and a long curled tail',s)

# Rooster: comb, wattle, pointed neck feathers and extravagant tail.
s=path('M151 128Q190 65 211 84Q196 89 184 127Q223 96 222 126Q206 122 185 145Q216 139 211 161Q190 153 166 169Z',grad('leaf'))+path('M160 131Q177 75 195 67Q216 73 193 85','none','#749A9B',12)
s+=path('M95 176L91 200M129 179L133 201M91 200L77 207M91 200L101 207M133 201L122 208M133 201L146 207','none','#D4A156',5)+ell(124,150,49,36,grad('fur'))+path('M82 141Q69 102 83 82L115 83Q128 117 139 134L124 143L116 128L108 146L98 130Z',grad('gold'))+ell(98,85,27,29,grad('gold'))+path('M81 62Q73 40 88 45Q89 24 101 41Q117 26 119 48L112 62Z',grad('red'))+ell(91,111,9,15,grad('red'))+path('M73 80L50 91L74 97Z','#D9A14D')+eye(88,80)+path('M116 142Q148 129 159 151Q150 174 121 164Z',grad('fox'))
save('rooster','A rooster with a red comb and wattle, two legs and long curved tail feathers',s)

s=path('M181 132Q211 115 212 134Q213 146 201 143Q194 140 201 136','none','#CE8C96',7)+feet([83,151],155,'#CD8B96',18,43)+ell(131,138,66,43,grad('pink'))+feet([72,163],157,grad('pink'),18,43)+path('M58 96L48 57L81 68M114 69L146 55L137 97',grad('pink'))+path('M59 78L56 65L75 73M122 74L138 64L132 84','#D17F8F')+ell(96,110,45,39,grad('pink'))+eye(78,104)+eye(113,104)+ell(96,128,29,21,'#F0BCBA')+ell(85,128,4,6,'#BE7F89')+ell(107,128,4,6,'#BE7F89')+path('M83 147Q95 153 108 146','none','#A96D7B',2)
for x in [72,83,151,163]:s+=rect(x,194,18,8,3,'#99747C')
save('pig','A pink pig with a round snout, four trotters and a curly tail',s)

# Bears: each has characteristic ears, muzzle, paws and coat markings.
def bear_body(coat,belly,ears,head=grad('brown')):
    return ell(120,158,50,44,coat)+ell(120,166,30,28,belly)+ell(72,154,16,34,coat,'transform="rotate(20 72 154)"')+ell(168,154,16,34,coat,'transform="rotate(-20 168 154)"')+ell(85,197,26,15,coat)+ell(155,197,26,15,coat)+circ(79,56,20,ears)+circ(161,56,20,ears)+ell(120,91,55,48,head)
s=bear_body(grad('dark'),grad('paper'),grad('dark'),grad('paper'))+ell(96,90,14,20,grad('dark'),'transform="rotate(28 96 90)"')+ell(145,90,14,20,grad('dark'),'transform="rotate(-28 145 90)"')+circ(97,88,3,'#FFF')+circ(144,88,3,'#FFF')+muzzle(121,113,23,16)
save('panda','A giant panda with black ears, eye patches, legs and a cream body',s)
s=bear_body(grad('brown'),'#D7B58D',grad('brown'))+circ(79,56,10,'#C4A080')+circ(161,56,10,'#C4A080')+eye(97,90)+eye(145,90)+muzzle(121,113,25,18)+ell(84,197,11,7,'#886B51')+ell(155,197,11,7,'#886B51')
save('bear','A brown bear with round ears, a broad muzzle and large paws',s)
s=feet([69,149],149,'#D8DFD7',21,44)+ell(126,137,69,42,grad('paper'))+feet([58,165],150,grad('paper'),23,48)+circ(76,73,12,grad('paper'))+circ(120,78,11,grad('paper'))+path('M67 73Q93 60 121 78L126 111Q115 139 74 130L42 118Q32 108 43 96Z',grad('paper'))+ell(43,107,9,7,INK)+eye(79,91)+path('M50 118Q63 125 73 117','none','#8B9A90',2)+ell(188,135,12,9,grad('paper'))
save('polar-bear','A cream-white polar bear with a long neck, black nose and broad paws',s)

s=path('M150 177Q213 177 205 112Q193 136 170 134Q173 158 145 159Z',grad('fox'))+path('M205 112Q213 142 195 161L175 144Q191 138 205 112Z',CREAM)+ell(112,157,39,42,grad('fox'))+ell(112,163,21,29,CREAM)+ell(88,199,19,9,'#9D6747')+ell(139,199,19,9,'#9D6747')+path('M63 90L55 37L96 61Q114 54 134 61L176 36L167 93Z',grad('fox'))+path('M66 70L64 49L85 65M146 65L166 49L163 74','#735F4D')+path('M59 88Q112 45 173 88L152 118L114 137L78 117Z',grad('fox'))+path('M61 91Q80 100 113 122L169 91Q167 115 113 137Q66 116 61 91Z',CREAM)+eye(91,93)+eye(137,93)+ell(113,121,7,5,INK)
save('fox','A red fox with pointed ears, a white muzzle and a bushy white-tipped tail',s)

s=path('M174 132Q208 143 208 179L184 169L170 146Z',grad('grey'))+feet([83,153],151,'#809A99',14,47)+ell(130,137,58,33,grad('grey'))+feet([71,164],151,grad('grey'),15,48)+path('M72 119L66 80L75 47L89 75L113 51L115 94L132 130L112 123L110 142L95 132Z',grad('grey'))+path('M72 80Q86 69 105 81L105 110L76 123L45 112Q38 106 46 99Z',grad('grey'))+path('M48 109L77 100L101 105L77 123Z',CREAM)+ell(46,105,6,4,INK)+eye(82,88)+path('M86 121L101 133L113 122','#D5DFD7')
save('wolf','A grey wolf with a long muzzle, upright ears and a thick lowered tail',s)

s=path('M177 134L201 162','none','#C4A064',5)+ell(203,165,6,10,'#87684A','transform="rotate(-25 203 165)"')+feet([99,150],141,'#CCA46B',11,60)+ell(140,124,47,29,grad('gold'))+feet([87,164],143,grad('gold'),12,58)+path('M90 135L78 74L92 51L109 70L113 121Z',grad('gold'))+path('M82 60L78 32M99 58L102 30','none','#C69B5E',6)+circ(78,31,5,'#96714E')+circ(102,29,5,'#96714E')+ell(65,58,15,7,grad('gold'),'transform="rotate(30 65 58)"')+ell(119,57,15,7,grad('gold'),'transform="rotate(-30 119 57)"')+ell(92,70,27,24,grad('gold'))+ell(75,83,26,13,'#E3C584')+eye(84,64)+eye(105,64)+circ(61,82,2,'#926E4C')
for x,y,w,h in [(92,105,8,12),(90,85,8,6),(117,116,12,10),(143,108,10,11),(166,120,10,10),(136,134,11,9),(103,127,7,9),(164,147,8,10),(87,159,8,10)]:s+=rect(x,y,w,h,3,'#B88953')
for x in [87,99,150,164]:s+=rect(x,198,12,7,2,'#806F54')
save('giraffe','A tall giraffe with a long neck, two ossicones, brown patches and four long legs',s)

s=path('M176 120Q197 119 202 159','none','#5B6F67',7)+ell(201,166,7,11,grad('dark'))+feet([90,151],151,'#D4D9CC',14,47)+ell(134,133,59,36,grad('paper'))+feet([76,165],151,grad('paper'),15,48)+path('M78 138L63 91L83 60L102 74L110 124Z',grad('paper'))+path('M84 62L91 51Q113 75 111 119L103 127Q101 87 87 74Z',grad('dark'))+path('M71 69L66 41L81 53L87 37L96 66Z',grad('paper'))+path('M74 56Q98 51 103 75L92 101Q72 119 48 107Q36 102 46 89Z',grad('paper'))+ell(52,100,16,11,grad('grey'))+eye(77,77)
for d in ['M91 72L83 86L68 91','M88 103L76 100','M104 100L90 110','M108 115L94 125','M117 100L123 136L113 159','M137 99L143 135L135 167','M157 105L162 132L153 158','M178 118L176 143L168 155','M78 168L91 172','M78 184L91 188','M166 171L178 176','M166 188L178 192']:s+=path(d,'none','#53675F',6)
for x in [76,90,151,165]:s+=rect(x,195,15,8,2,INK)
save('zebra','A zebra with black stripes, upright mane and four hooves',s)

# Large grey mammals have intentionally different heads and horn/ear anatomy.
s=path('M182 131Q207 142 199 159','none','#839C99',5)+feet([88,156],153,'#7F9997',20,45)+ell(132,136,68,46,grad('grey'))+feet([70,170],154,grad('grey'),23,44)+path('M74 87L68 65Q82 61 90 84M115 88L120 63Q135 68 131 91',grad('grey'))+path('M69 86Q113 73 131 108L112 140L62 149L33 135Q28 120 41 110Z',grad('grey'))+path('M42 119Q30 94 43 79Q45 103 57 111Z',CREAM)+path('M64 109L67 92L76 107Z',CREAM)+eye(93,100)+ell(42,135,4,3,INK)+path('M66 145Q85 151 102 143','none','#6E8D8A',2)+path('M121 110Q111 132 120 158','none','#6E8D8A',3)
save('rhinoceros','A grey rhinoceros with a large nose horn, a smaller horn and thick legs',s)
s=path('M189 139L206 151','none','#87959C',6)+feet([91,155],156,'#8C9FA7',22,39)+ell(137,139,65,44,grad('grey'))+feet([77,167],158,grad('grey'),24,41)+circ(65,91,11,grad('grey'))+circ(119,87,11,grad('grey'))+ell(94,118,43,37,grad('grey'))+ell(82,141,47,27,'#A3BAC0')+eye(74,103)+eye(111,101)+ell(57,134,4,3,'#657F83')+ell(96,134,4,3,'#657F83')+path('M52 152Q82 164 111 150','none','#718C8D',2.5)+rect(65,156,8,8,2,CREAM)+rect(95,154,8,8,2,CREAM)
save('hippopotamus','A round grey hippopotamus with small ears, a broad muzzle and short legs',s)

s=path('M148 177Q183 182 218 203Q187 207 149 198L126 186Z',grad('fur'))+ell(127,151,36,48,grad('fur'),'transform="rotate(-15 127 151)"')+ell(105,180,30,22,grad('fur'))+ell(94,200,38,8,'#B88B5F')+ell(146,201,25,8,'#B88B5F')+ell(119,160,20,27,'#F5DFBB')+path('M112 141Q91 142 85 159M140 136Q157 143 151 155','none','#C9996D',12)+path('M112 83L97 42Q98 29 107 35L129 73M137 77L144 33Q150 20 155 35L155 82',grad('fur'))+path('M106 42L119 73M150 37L147 74','none','#D7A5A0',5)+ell(129,97,31,32,grad('fur'))+path('M119 99Q97 98 91 110Q93 126 126 121L140 109Z','#F4DFBD')+ell(95,110,6,5,INK)+eye(122,91)+eye(145,92)+path('M106 158Q121 173 136 157L131 179Q119 187 108 177Z','#E5BF8C')
save('kangaroo','A kangaroo with long ears, powerful back legs, a pouch and a strong tail',s)

s=path('M180 29L166 207','none','#B69B79',14)+path('M173 97L202 72','none','#B69B79',8)+ell(122,159,42,43,grad('grey'))+ell(120,170,23,25,'#DDE3D8')+path('M91 145Q71 172 85 192M147 143Q177 143 177 122','none','#91A9A8',20)+ell(93,198,22,12,grad('grey'))+ell(149,198,23,12,grad('grey'))+circ(69,73,28,grad('grey'))+circ(169,73,28,grad('grey'))+circ(69,73,18,'#D6DDD5')+circ(169,73,18,'#D6DDD5')+ell(120,97,54,47,grad('grey'))+eye(95,96)+eye(147,96)+ell(121,107,13,20,grad('dark'))+path('M111 129Q122 136 132 129','none',INK,2)+path('M182 63Q198 41 217 49Q213 71 182 63Z',grad('leaf'))
save('koala','A grey koala with fluffy round ears and a large dark nose holding a branch',s)

s=path('M175 125L193 109L188 132Z',grad('fur'))+feet([98,153],149,'#BC966D',11,51)+ell(132,132,55,34,grad('fur'))+feet([85,166],151,grad('fur'),12,50)+path('M83 134L67 88L90 70L108 95L109 129Z',grad('fur'))
s+=path('M76 77L64 51L64 27M64 49L47 42L42 29M64 39L80 29M105 77L118 50L120 26M118 49L135 41L141 28M119 39L104 29','none','#B2936E',5)
s+=ell(60,82,19,9,grad('fur'),'transform="rotate(25 60 82)"')+ell(122,81,19,9,grad('fur'),'transform="rotate(-25 122 81)"')+path('M68 82Q93 63 116 83L107 115L91 130L76 116Z',grad('fur'))+path('M80 109L91 128L103 108Z',CREAM)+eye(80,96)+eye(104,96)+ell(91,119,5,4,INK)
for x,y in [(116,118),(137,111),(155,118),(125,133),(151,137),(170,129)]:s+=ell(x,y,3,4,CREAM)
for x in [85,98,153,166]:s+=rect(x,198,12,6,2,'#766C57')
save('deer','A spotted deer with branching antlers, pointed ears and slender legs',s)

s=path('M178 129Q202 144 200 161','none','#BD9566',5)+feet([94,152],146,'#B89063',12,54)+path('M74 133Q88 121 93 84Q105 51 123 88Q143 60 159 84L173 121Q191 137 174 155L93 159Z',grad('fur'))+feet([82,166],150,grad('fur'),13,51)+path('M91 144Q60 125 61 95L65 68L84 71L84 107Q84 117 104 123Z',grad('fur'))+ell(69,62,17,22,grad('fur'))+path('M57 48L47 35L62 41M78 43L89 33L87 53',grad('fur'))+ell(52,75,25,12,'#E1BC8B')+eye(61,59)+circ(33,72,2.5,'#8A6A4B')+path('M35 82L56 84','none','#8A6A4B',2)
save('camel','A Bactrian camel with two humps, a long neck and broad feet',s)

s=path('M146 190C220 185 219 99 183 76C147 51 126 79 151 99C178 108 181 139 157 147Z',grad('fox'))+path('M165 169C197 147 187 100 161 91','none','#F2C399',10)+ell(111,160,38,41,grad('fox'))+ell(105,168,23,28,CREAM)+ell(81,199,23,10,grad('fox'))+ell(130,199,23,10,grad('fox'))+path('M77 92L70 53L91 69M115 68L133 50L134 90',grad('fox'))+ell(103,106,37,35,grad('fox'))+ell(82,121,24,15,CREAM)+ell(65,117,5,4,INK)+eye(90,102)+eye(119,99)+path('M96 148Q108 155 122 147','none','#BE7E4F',12)+ell(108,154,15,18,grad('brown'))+path('M91 148Q107 129 124 147Z','#7B6A4C')+line(108,137,109,131,'#7B6A4C',4)
save('squirrel','A red squirrel with a large curling bushy tail holding an acorn',s)

s=ell(107,190,17,8,'#AD8A68')+ell(164,190,17,8,'#AD8A68')+path('M56 158L45 138L59 131L53 112L72 108L72 88L91 93L101 74L117 86L133 71L146 87L166 77L172 98L193 101L191 120L208 134L195 149L199 167L179 174L174 188L82 188Z',grad('brown'))
for x,y in [(89,112),(119,103),(151,108),(177,122),(107,133),(139,132),(162,152),(115,160)]:s+=path(f'M{x-4} {y+7}l4 -14l6 12','none','#D4B58B',3)
s+=path('M77 124Q107 143 104 178Q77 195 42 173L26 158L43 151Q48 131 77 124Z',grad('fur'))+circ(73,135,10,grad('fur'))+eye(55,153)+ell(29,159,6,5,INK)
save('hedgehog','A small hedgehog with a pointed snout, short legs and a coat of spines',s)

s=path('M106 112Q67 53 24 80Q39 92 39 115Q53 108 64 126Q78 117 91 145L106 160Z',grad('purple'))+path('M134 112Q173 53 216 80Q201 92 201 115Q187 108 176 126Q162 117 149 145L134 160Z',grad('purple'))
s+=path('M106 119L42 83M102 126L63 113M134 119L198 83M138 126L177 113','none','#88749D',2.5)+ell(120,144,23,37,grad('dark'))+path('M99 100L95 61L114 79L127 79L145 61L140 103Z',grad('dark'))+ell(120,108,28,24,grad('dark'))+circ(108,105,4,'#F8F0D8')+circ(132,105,4,'#F8F0D8')+circ(108,105,2,INK)+circ(132,105,2,INK)+path('M116 116L120 119L124 116','#D8A6A0')+path('M109 177L104 187M130 177L135 187','none','#73857C',5)
save('bat','A bat with two webbed wings, pointed ears and two small feet',s)

s=path('M145 181Q201 172 214 194Q179 207 143 199Z',grad('brown'))+ell(117,152,32,51,grad('brown'))+ell(113,159,20,35,'#E4C8A4')+ell(90,198,20,10,grad('brown'))+ell(141,198,20,10,grad('brown'))+circ(87,75,13,grad('brown'))+circ(145,75,13,grad('brown'))+ell(116,101,40,33,grad('brown'))+eye(101,96)+eye(133,96)+muzzle(117,115,25,15)+path('M91 145Q108 163 140 146','none','#A9835E',11)+ell(116,154,12,8,grad('grey'))
for x,y,x2,y2 in [(94,114,74,110),(95,120,75,125),(140,113,160,109),(138,120,160,126)]:s+=line(x,y,x2,y2,'#876D54',1.5)
save('otter','A brown otter with small ears, whiskers and a long tapering tail holding a pebble',s)

s=ell(179,183,38,23,grad('dark'),'transform="rotate(-25 179 183)"')
for d in ['M153 177L188 199','M161 168L200 190','M173 163L208 182','M155 193L180 165','M169 203L196 169']:s+=path(d,'none','#84938A',2)
s+=ell(116,158,43,43,grad('brown'))+ell(84,198,24,10,grad('brown'))+ell(139,198,24,10,grad('brown'))+circ(86,75,15,grad('brown'))+circ(144,75,15,grad('brown'))+ell(115,105,43,35,grad('brown'))+eye(97,100)+eye(132,100)+muzzle(115,119,25,16)+rect(106,127,9,17,2,CREAM)+rect(117,127,9,17,2,CREAM)+path('M84 149L138 173','none','#B99366',13)+path('M93 162L151 146','none','#856D4D',10)+line(95,160,150,145,'#C6AB7D',3)
save('beaver','A brown beaver with two large front teeth and a flat crosshatched paddle tail',s)

s=path('M151 176Q211 182 209 124','none','#899C94',24)
for d in ['M180 174L184 153','M200 161L181 145','M209 139L188 135']:s+=path(d,'none','#4B6158',9)
s+=ell(117,159,43,42,grad('grey'))+ell(117,170,26,28,'#DDE1D2')+ell(86,199,22,9,grad('dark'))+ell(145,199,22,9,grad('dark'))+path('M74 81L70 47L95 65M140 64L163 45L163 84',grad('grey'))+ell(117,99,51,42,grad('grey'))+path('M71 90Q91 77 111 96L117 109L125 96Q145 77 164 90L154 111Q137 122 118 113Q96 124 79 112Z',grad('dark'))+circ(96,98,3,'#FFF')+circ(141,98,3,'#FFF')+path('M116 87L102 122L116 133L132 121L122 88Z',CREAM)+ell(117,121,7,5,INK)
save('raccoon','A grey raccoon with a black eye mask and a ringed tail',s)

s=ell(120,151,49,47,grad('dark'))+ell(120,153,30,33,'#8D9B90')+path('M80 124Q50 138 48 190M161 124Q189 138 191 190','none','#53665D',28)+ell(47,196,20,12,grad('dark'))+ell(192,196,20,12,grad('dark'))+ell(89,198,22,12,grad('dark'))+ell(151,198,22,12,grad('dark'))+circ(76,88,13,grad('dark'))+circ(164,88,13,grad('dark'))+ell(120,81,49,48,grad('dark'))+path('M87 75Q101 61 120 75Q138 62 154 75L146 107Q120 132 94 108Z','#8B9B91')+path('M89 79Q103 72 112 80M129 80Q141 73 151 79','none','#4D6155',7)+eye(102,84)+eye(139,84)+ell(120,103,26,18,'#A0ADA0')+ell(114,99,3,2.5,INK)+ell(127,99,3,2.5,INK)+path('M105 113Q120 118 136 112','none',INK,2)
save('gorilla','A grey gorilla with a broad chest, long strong arms and a flat dark face',s)

# Water birds: webbed feet, broad bills, distinctive necks and wing shapes.
s=path('M89 178L84 197L65 204L100 204L96 195M135 180L139 197L125 205L157 204L146 194',grad('gold'))+path('M172 138L204 126L190 157Z',grad('brown'))+ell(129,150,59,35,grad('brown'))+path('M85 129L79 106L109 99L121 141Z',grad('leaf'))+circ(91,94,28,grad('leaf'))+path('M67 96Q43 91 35 104Q45 117 73 111Z',grad('gold'))+eye(84,88)+path('M77 118L109 119','none',CREAM,6)+path('M120 140Q146 123 166 141Q160 165 127 168Z','#9BBFC3')+path('M126 149L157 148','none','#E5EFDB',5)
save('duck','A mallard duck with a green head, broad yellow bill and two webbed feet',s)

s=path('M106 180L103 198L87 205H117L112 196M149 179L151 198L136 205H168L159 197',grad('gold'))+path('M169 138L205 126L191 151Z',grad('paper'))+ell(139,152,56,33,grad('paper'))+path('M109 142Q76 135 76 110L78 66L101 67L99 112Q103 122 131 129Z',grad('paper'))+ell(87,63,25,23,grad('paper'))+path('M66 62L35 73L66 80Z',grad('gold'))+eye(80,57)+path('M130 140Q160 125 181 147Q165 171 136 166Z','#DFDFCC')+path('M140 146L174 144','none','#FFF9E8',3)
save('goose','A white goose with a long neck, orange bill and webbed feet',s)

s=ell(91,201,27,10,grad('gold'),'transform="rotate(-12 91 201)"')+ell(151,201,27,10,grad('gold'),'transform="rotate(12 151 201)"')+path('M84 102Q53 125 51 165Q65 157 85 135M156 102Q187 125 189 165Q175 157 155 135',grad('dark'))+ell(120,131,53,70,grad('dark'))+ell(120,145,36,52,grad('paper'))+ell(120,76,39,37,grad('dark'))+path('M88 75Q102 59 120 80Q138 59 152 75L149 103Q120 119 92 103Z',grad('paper'))+eye(105,81)+eye(136,81)+path('M111 92L121 107L131 92Z',grad('gold'))+cheek(96,95)+cheek(146,95)
save('penguin','A penguin with a black back, white belly, flipper wings and orange webbed feet',s)

s=path('M73 196L102 196M140 196L169 196M92 181L91 198M150 181L151 198','none','#BD965A',5)+path('M67 102L63 45L93 64Q119 55 147 64L178 45L173 104L179 153Q175 193 121 194Q65 194 61 151Z',grad('brown'))+path('M73 117Q79 166 102 177L94 118M167 117Q161 166 138 177L146 118',grad('fur'))+ell(96,104,29,33,'#E8D6B7')+ell(145,104,29,33,'#E8D6B7')+circ(96,101,17,grad('gold'))+circ(145,101,17,grad('gold'))+eye(96,101,9)+eye(145,101,9)+path('M111 125L120 140L129 125Z','#C39054')
for x,y in [(109,153),(132,153),(120,171)]:s+=path(f'M{x-4} {y}l4 5l4 -5','none','#80684D',2)
save('owl','A brown owl with large round forward-facing eyes, ear tufts and a small hooked beak',s)

s=path('M110 160L96 192L121 186L143 194L132 160Z',grad('brown'))+path('M90 97Q57 70 25 92L44 96L28 107L53 106L39 124L64 116L54 138L80 126L90 144Z',grad('brown'))+path('M151 97Q183 70 215 92L196 96L212 107L187 106L201 124L176 116L186 138L160 126L150 144Z',grad('brown'))+ell(120,132,37,48,grad('brown'))+path('M93 84Q87 51 115 45Q147 43 150 75L144 111L129 105L120 119L109 108L97 115Z',grad('paper'))+path('M134 70Q159 67 162 83L153 98L148 83L132 84Z',grad('gold'))+eye(131,66)+path('M101 175L96 195M136 175L143 195M96 195L86 200M96 195L104 202M143 195L133 202M143 195L155 201','none','#C49651',4)
save('eagle','A bald eagle with a white head, hooked yellow beak and broad feathered wings',s)

s=path('M108 152L90 212L119 198L132 211L139 151Z',grad('blue'))+path('M95 194H162','none','#B8976F',7)+path('M111 175L109 195M136 174L138 195','none','#A29372',5)+ell(121,130,37,53,grad('red'))+path('M134 106Q175 128 148 175L127 161Z',grad('leaf'))+path('M137 139L153 144L145 168L128 162Z',grad('gold'))+path('M137 157L148 166L138 186L125 174Z',grad('blue'))+circ(119,73,33,grad('red'))+path('M126 55Q150 55 151 80Q139 94 123 84Z',grad('paper'))+path('M146 65Q178 70 164 96L155 106Q159 83 145 82Z',grad('dark'))+eye(138,68)+path('M95 51Q98 38 114 37','none','#E48B77',6)
save('parrot','A red parrot with a curved dark beak, green wings and a long blue tail',s)

# Peacock fan: seven long feathers radiate from the rump; all eye spots are visible.
s=''
for a in range(-60,61,20):
    s+=group(path('M0 0Q-26 -50 -17 -104Q-15 -133 0 -133Q15 -133 17 -104Q26 -50 0 0Z',grad('leaf'))+path('M0 -5V-118','none','#9DB98C',1.5)+ell(0,-105,12,18,grad('gold'))+ell(0,-106,8,12,grad('blue'))+ell(0,-107,4,7,grad('dark')),f'translate(120 179) rotate({a})')
s+=path('M109 183L106 205M132 182L137 205M106 205L96 210M137 205L149 209','none','#A29164',4)+ell(120,160,29,35,grad('blue'))+path('M110 146L106 111L126 108L133 148Z',grad('blue'))+ell(117,102,19,21,grad('blue'))+path('M107 84L101 73M116 81L116 68M125 85L132 74','none','#729493',2.5)+circ(100,72,3,grad('blue'))+circ(116,67,3,grad('blue'))+circ(133,73,3,grad('blue'))+eye(122,99)+path('M133 104L148 110L133 115Z','#BDA16D')+path('M97 153Q110 143 120 160Q111 178 100 174M141 153Q131 143 121 160Q131 179 141 174',grad('leaf'))
save('peacock','A blue peacock with a wide green fan of eye-spotted tail feathers and two legs',s)

s=path('M122 153L120 206L106 209M141 153L158 176L140 191L159 195','none','#CE8C89',5)+ell(135,130,47,28,grad('pink'))+path('M166 118L190 122L177 139Z','#C98394')+path('M103 135C69 133 77 105 94 92C112 77 99 60 83 60','none',grad('pink'),16)+ell(82,55,20,18,grad('pink'))+path('M65 55Q47 64 58 82L70 89L70 74L77 64Z',CREAM)+path('M58 72L70 78L70 89L58 82Q52 78 54 72Z',INK)+eye(77,51)+path('M126 117Q150 102 167 124L152 141L120 140Z','#E3A4AB')
save('flamingo','A pink flamingo with a curved neck, bent bill and two long legs, one raised',s)

s=path('M107 155L102 198L85 205M142 155L149 199L168 205','none','#CEB599',7)+path('M101 197L112 207M149 199L138 207','none','#CEB599',4)+ell(128,128,55,37,grad('dark'))+path('M89 126Q70 118 71 88L75 49L89 50L87 88Q90 104 105 107Z',grad('paper'))+ell(82,44,21,18,grad('paper'))+path('M65 46L41 53L65 59Z','#D8AF90')+eye(77,40)+path('M171 108L198 94L194 113L208 116L183 140Z',grad('paper'))+path('M119 111Q155 90 168 126L156 147L137 143L123 149Z',grad('paper'))
save('ostrich','An ostrich with a long bare neck, small head, feathered body and two powerful legs',s)

s=rect(164,27,22,181,8,grad('brown'))+path('M170 40V74M178 97V137M170 166V191','none','#D3B08C',3)+path('M107 161L87 201L109 191L126 172Z',grad('dark'))+ell(123,131,33,48,grad('dark'),'transform="rotate(15 123 131)"')+path('M122 112Q149 119 144 154Q139 171 128 171L117 151Z',grad('paper'))+path('M102 123L129 135M98 136L124 148M100 150L120 160','none','#E7E4CF',5)+circ(131,78,28,grad('dark'))+path('M109 60Q115 35 142 45L151 58Z',grad('red'))+path('M117 65L143 66L151 85L135 93L116 88Z',grad('paper'))+eye(137,72)+path('M155 77L182 82L153 88Z','#A29B7C')+path('M142 142L165 144M139 158L166 159','none','#B9A077',4)+path('M164 139L171 144L166 150M165 154L172 159L166 165','none','#B9A077',3)
save('woodpecker','A woodpecker with a red crown, strong pointed beak and feet gripping a tree trunk',s)

# Marine creatures are swimming, with fins/arms modeled separately.
s=path('M38 145Q64 95 126 100Q167 101 188 132L211 111L212 136L226 154L193 153Q156 181 94 164L60 173L74 153Z',grad('blue'))+path('M115 103L138 65L151 106Z',grad('blue'))+path('M111 153L139 184L143 153Z','#719BA8')+path('M42 143L20 151Q23 160 57 157L76 150Z',grad('blue'))+path('M61 149Q98 169 160 144Q142 175 92 165L62 172Z','#D7E5DE')+eye(64,134)+path('M37 153Q58 163 75 149','none','#547E8A',2)
save('dolphin','A blue-grey dolphin with a curved dorsal fin, long beak and tail flukes',s)

s=path('M54 94Q97 67 148 102Q174 119 184 139L193 109L216 103L212 130L225 143Q207 159 185 161Q154 196 92 185Q39 178 31 139Q24 108 54 94Z',grad('blue'))+path('M36 143Q91 178 173 152Q146 193 89 180Q53 177 36 143Z','#D6E5DE')+path('M111 155Q121 193 151 186L138 159Z','#729CAA')+eye(61,128)+path('M44 149Q61 158 79 144','none','#547E8A',2)+path('M76 88Q74 60 62 51M76 87Q83 61 98 55','none','#A2C9D6',5)+ell(60,47,5,8,'#A2C9D6')+ell(101,51,5,8,'#A2C9D6')
save('whale','A large blue whale with tail flukes, a flipper and water spouting from its blowhole',s)

s=path('M28 137Q56 107 113 107L130 64L151 110Q179 118 190 134L218 102L210 140L224 173L189 151Q161 181 98 169L71 191L78 161Q47 155 28 137Z',grad('grey'))+path('M31 139Q98 164 181 146Q148 176 94 166L78 162Q47 157 31 139Z','#E3EBDF')+path('M132 151L153 186L162 148Z','#7C9A9B')+eye(61,130)+path('M41 145Q58 156 77 145','none',INK,2)+path('M49 149L53 155L57 150M61 150L65 155L69 148',CREAM)+path('M88 126L84 146M99 126L95 147M110 127L106 149','none','#617F80',2.5)
save('shark','A grey shark with a triangular dorsal fin, gill slits and a crescent tail fin',s)

# Exactly eight arms, each with one visible curved tip.
arms=[('M82 141C57 134 52 158 35 158C22 158 22 145 30 143',[(52,150),(37,153)]),('M88 151C66 156 74 182 53 181C39 181 38 169 46 167',[(67,170),(54,176)]),('M100 158C86 173 97 197 79 199C66 200 62 189 69 184',[(92,183),(82,194)]),('M113 164C109 184 121 210 106 211C98 212 95 205 99 200',[(113,190),(110,204)]),('M127 164C131 184 119 210 134 211C142 212 145 205 141 200',[(127,190),(130,204)]),('M140 158C154 173 143 197 161 199C174 200 178 189 171 184',[(148,183),(158,194)]),('M152 151C174 156 166 182 187 181C201 181 202 169 194 167',[(173,170),(186,176)]),('M158 141C183 134 188 158 205 158C218 158 218 145 210 143',[(188,150),(203,153)])]
s=''
for d,dots in arms:s+=path(d,'none','#C398B8',14)+''.join(circ(x,y,2,'#F5D6DF') for x,y in dots)
s+=path('M76 129C69 74 88 41 121 41C156 41 174 74 164 129Q161 164 121 166Q79 165 76 129Z',grad('purple'))+eye(101,117,4)+eye(143,117,4)+path('M111 134Q122 143 134 132','none','#5B5B5B',2.5)+cheek(88,131)+cheek(155,131)+path('M90 88Q93 65 108 60','none','#D9BFE1',5)
save('octopus','A purple octopus with a rounded head and exactly eight curling arms',s)

s=''
for x,y,dx in [(64,126,-8),(86,134,8),(108,136,-6),(132,136,7),(154,134,-7),(176,126,6)]:s+=path(f'M{x} {y}C{x+dx*3} {y+26} {x-dx*2} {y+42} {x+dx} {y+64}','none','#CAAAD2',5)
s+=path('M43 127C42 70 77 42 120 42C163 42 198 72 197 127Q184 142 171 130Q158 145 145 132Q132 148 119 133Q106 147 93 132Q80 146 67 131Q54 140 43 127Z',grad('pink'))+path('M63 104Q68 68 100 62','none','#F6D2CD',6)+eye(99,106)+eye(143,106)+path('M111 119Q121 128 132 118','none','#997883',2)+ell(78,116,7,4,'#E7ADB1')+ell(163,116,7,4,'#E7ADB1')
save('jellyfish','A pink jellyfish with a bell-shaped body and six long trailing tentacles',s)

s=path('M126 67L139 52L148 69L159 66L155 83L167 91L154 100L162 116L145 123L148 140L133 146L129 160L114 155L108 137L113 113Z',grad('gold'))+path('M113 105C100 122 99 149 116 165C135 181 143 191 130 202C117 214 95 203 100 190C102 183 111 185 109 191','none',grad('gold'),18)+path('M110 106Q94 124 113 150','none','#E8C18C',10)+path('M116 58Q127 37 143 51L148 73L132 95L116 95L100 87L71 86L68 73L105 69Z',grad('gold'))+path('M118 54L105 44L124 42L129 32L137 48Z','#D4A65D')+eye(129,66)+path('M108 116Q79 117 93 145L111 137Z','#E7B884')+path('M116 116L128 120M113 130L125 135M116 145L129 148M125 162L135 164','none','#D0A057',3)+ell(69,80,4,7,'#BC9660')
save('seahorse','A golden seahorse with a horse-shaped head, small dorsal fin and curled tail',s)

s=path('M162 175Q194 167 210 181L197 192L213 204Q184 210 161 191Z',grad('grey'))+ell(124,166,63,34,grad('grey'))+path('M108 176Q114 206 143 207L136 180Z','#88A6A8')+path('M67 164Q56 144 62 115L89 93L112 119L107 165Z',grad('grey'))+ell(83,108,34,31,grad('grey'))+ell(82,124,23,14,'#DDE5DB')+eye(69,103)+eye(96,103)+ell(82,119,6,4,INK)+path('M82 124V129M82 129L75 132M82 129L89 132','none',INK,1.5)
for x,y,x2,y2 in [(65,122,41,117),(66,128,41,132),(98,122,122,117),(98,128,124,132)]:s+=line(x,y,x2,y2,'#68867F',1.5)
save('seal','A grey seal with whiskers, flippers and a pair of rear flippers',s)

s=''
for y in [133,150,167,182]:s+=path(f'M83 {y}L50 {y-3}L35 {y+13}M157 {y}L190 {y-3}L205 {y+13}','none','#D88570',7)
s+=path('M81 133L61 111L51 90M159 133L179 111L189 90','none','#D88570',10)+path('M52 96Q22 86 32 59L48 76L56 51Q78 70 62 92Z',grad('red'))+path('M188 96Q218 86 208 59L192 76L184 51Q162 70 178 92Z',grad('red'))+ell(120,149,49,34,grad('red'))+path('M101 124L96 107M139 124L144 107','none','#DD8F79',7)+circ(95,104,10,grad('red'))+circ(145,104,10,grad('red'))+eye(95,102)+eye(145,102)+path('M108 154Q120 165 133 153','none','#885F50',2.5)+path('M85 140Q99 126 113 128','none','#FFB49D',5)
save('crab','An orange crab with two large claws, eight walking legs and stalked eyes',s)

s=path('M120 32Q128 30 134 68L145 91L194 89Q220 88 201 107L167 134L181 179Q187 205 167 193L120 163L76 194Q55 207 61 181L75 135L40 109Q19 91 45 90L94 91L107 51Q113 31 120 32Z',grad('gold'))
for x,y in [(120,67),(120,91),(85,111),(61,103),(155,111),(180,103),(100,148),(86,171),(141,148),(155,171)]:s+=circ(x,y,3.5,'#DCA450')
s+=eye(105,122)+eye(137,122)+path('M112 137Q121 145 130 136','none','#97784A',2)
save('starfish','A golden starfish with exactly five arms and a bumpy surface',s)

# Reptiles/amphibian have tails and limb poses unlike mammals.
s=path('M146 142Q191 138 222 163Q199 176 159 171Z',grad('leaf'))+path('M82 159L67 188L49 188M128 164L140 193L161 192M101 130L91 111L73 110M148 130L164 113L184 116','none','#709971',14)+ell(118,150,65,29,grad('green'))+path('M56 132L28 137Q15 151 32 161L88 165L100 139Z',grad('green'))+ell(69,130,12,12,grad('green'))+ell(91,130,12,12,grad('green'))+eye(68,127)+eye(90,127)+path('M30 151L79 151','none','#51785B',2)+path('M38 151L42 158L46 151M56 151L60 158L64 151',CREAM)
for x,y in [(103,124),(125,122),(147,130),(172,140),(192,146)]:s+=path(f'M{x-6} {y+8}L{x} {y-4}L{x+7} {y+9}Z','#46745B')
for x,y in [(49,188),(161,192),(73,110),(184,116)]:s+=path(f'M{x-4} {y-4}l-5 7m10 -7v9m5 -8l5 7','none','#91B17C',3)
save('crocodile','A green crocodile with a long toothed snout, four short legs and a ridged tail',s)

s=ell(72,170,31,22,grad('leaf'),'transform="rotate(-24 72 170)"')+ell(168,170,31,22,grad('leaf'),'transform="rotate(24 168 170)"')+ell(120,151,49,41,grad('green'))+ell(120,162,29,27,'#DCE5AC')+path('M87 147L77 193L62 201M153 147L163 193L178 201','none','#83A66E',12)+path('M61 200L48 196M62 201L53 209M62 201L66 213M178 200L191 196M178 201L187 209M178 201L174 213','none','#83A66E',5)+ell(120,111,58,39,grad('green'))+circ(85,80,24,grad('green'))+circ(155,80,24,grad('green'))+circ(85,79,16,CREAM)+circ(155,79,16,CREAM)+eye(87,80,7)+eye(153,80,7)+path('M85 117Q120 145 155 117','none','#567A53',3)+circ(108,107,2.5,'#567A53')+circ(133,107,2.5,'#567A53')
save('frog','A green frog with large raised eyes, powerful back legs and webbed toes',s)

s=path('M152 148C213 125 225 183 190 192C179 193 173 185 180 180','none',grad('green'),17)+path('M102 125L101 103L79 99M135 125L150 106L169 109M99 155L87 179L65 178M139 156L155 179L178 176','none','#80A06C',10)+ell(121,140,47,26,grad('green'),'transform="rotate(8 121 140)"')+path('M85 122Q66 103 44 115L34 135L48 149L84 151L101 136Z',grad('green'))+eye(54,124,5)+path('M37 138L68 142','none','#527B52',2)+path('M40 138L26 145M28 144L19 142M28 144L22 151','none','#CD9B8F',2)
for x,y in [(101,129),(119,134),(139,143),(110,148),(159,153)]:s+=ell(x,y,4,3,'#C2D299')
for x,y in [(79,99),(169,109),(65,178),(178,176)]:s+=path(f'M{x} {y}l-10 -5m10 5l-10 5m10 -5l-3 11','none','#80A06C',3)
save('lizard','A green lizard with four splayed legs, a forked tongue and a long curling tail',s)

# Insects: exactly six legs (three per side); antennae are attached to their heads.
s=path('M111 113C76 38 28 48 37 97Q41 127 90 141C32 143 46 199 80 184Q104 175 113 145Z',grad('gold'))+path('M129 113C164 38 212 48 203 97Q199 127 150 141C208 143 194 199 160 184Q136 175 127 145Z',grad('pink'))+ell(67,91,16,24,'#F4C380','transform="rotate(-27 67 91)"')+ell(173,91,16,24,'#EAB7C9','transform="rotate(27 173 91)"')+ell(77,160,12,15,'#F0B985')+ell(163,160,12,15,'#D59BB2')+path('M114 116L99 108M114 128L98 129M114 140L102 151M126 116L141 108M126 128L142 129M126 140L138 151','none','#736D51',3)+ell(120,130,8,39,grad('brown'))+path('M117 94Q104 77 105 68M123 94Q136 77 135 68','none','#806B53',3)+circ(105,67,3,'#806B53')+circ(135,67,3,'#806B53')+circ(120,98,12,grad('brown'))+eye(116,97,2)+eye(124,97,2)
save('butterfly','A butterfly with four colorful wings, six legs and two antennae',s)

s=ell(86,113,22,29,'#BDDAD5','transform="rotate(-55 86 113)"')+ell(154,113,22,29,'#BDDAD5','transform="rotate(55 154 113)"')+ell(96,87,27,38,'#CEE3DE','transform="rotate(-40 96 87)"')+ell(146,87,27,38,'#CEE3DE','transform="rotate(40 146 87)"')+path('M96 75L110 98M146 76L133 98','none','#EEF7EA',4)
s+=path('M96 137L77 145L72 162M103 154L86 169L86 181M143 137L161 145L168 162M137 154L154 169L154 181M111 167L103 187M130 167L138 187','none','#695F47',4)
s+=ell(120,139,39,45,grad('gold'))+path('M85 126Q120 142 155 126L157 140Q120 157 83 140Z',grad('dark'))+path('M91 157Q120 168 149 157Q143 175 120 183Q98 177 91 157Z',grad('dark'))+path('M113 182L120 198L127 182Z','#695F47')+path('M108 92L97 69M132 92L143 69','none','#695F47',3)+circ(96,67,4,'#695F47')+circ(144,67,4,'#695F47')+circ(120,100,26,grad('gold'))+eye(109,98)+eye(132,98)+path('M112 111Q121 118 130 110','none','#806B46',2)
save('bee','A golden bee with dark stripes, four wings, six legs and two antennae',s)

s=path('M82 119L55 111L47 125M79 142L51 145L44 158M91 165L67 181L68 194M158 119L185 111L193 125M161 142L189 145L196 158M149 165L173 181L172 194','none','#53665B',6)+path('M105 83L93 65M134 83L147 65','none','#53665B',3)+circ(92,63,4,INK)+circ(148,63,4,INK)+ell(120,91,28,23,grad('dark'))+ell(120,142,51,54,grad('red'))+line(120,96,120,194,'#8C5D4E',3)
for x,y,r in [(97,116,9),(88,143,10),(103,171,9),(143,116,9),(152,143,10),(137,171,9)]:s+=circ(x,y,r,grad('dark'))
s+=circ(109,83,4,CREAM)+circ(132,83,4,CREAM)+eye(109,83,2.3)+eye(132,83,2.3)+path('M81 126Q84 107 98 102','none','#FFB5A4',4)
save('ladybug','A red ladybug with six black spots, six legs and two antennae',s)

s=path('M101 130L69 114L53 123M103 145L65 145L50 163M109 158L81 179L68 197M139 130L171 114L187 123M137 145L175 145L190 163M131 158L159 179L172 197','none','#896C52',6)+ell(120,178,32,29,grad('brown'))+ell(120,138,19,25,grad('brown'))+path('M106 89L90 65L74 65M134 89L150 65L166 65','none','#896C52',4)+circ(120,101,30,grad('brown'))+eye(108,98)+eye(132,98)+path('M111 115L108 123M129 115L132 123','none','#735D47',3)+path('M101 173Q106 161 116 160','none','#D0B088',4)+path('M98 191Q120 201 143 190','none','#9C7A57',3)
save('ant','A brown ant with three body sections, six legs and two bent antennae',s)

EXPECTED='rat ox tiger dragon snake horse goat monkey rooster pig panda bear polar-bear fox wolf giraffe zebra rhinoceros hippopotamus kangaroo koala deer camel squirrel hedgehog bat otter beaver raccoon gorilla duck goose penguin owl eagle parrot peacock flamingo ostrich woodpecker dolphin whale shark octopus jellyfish seahorse seal crab starfish crocodile frog lizard butterfly bee ladybug ant'.split()
assert CREATED==EXPECTED, (len(CREATED),set(EXPECTED)-set(CREATED))
if __name__=='__main__': print(f'Created {len(CREATED)} original animal SVG illustrations in {OUT}')
