"""Create original, self-contained Little Explorer illustrations. No external assets."""
from pathlib import Path
from xml.sax.saxutils import escape
import math

OUT = Path(__file__).resolve().parents[1] / 'public' / 'art'
OUT.mkdir(parents=True, exist_ok=True)
INK = '#394E43'
CREAM = '#FFF4DB'


def path(d, fill, stroke=None, sw=2, extra=''):
    return f'<path d="{d}" fill="{fill}"' + (f' stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"' if stroke else '') + f' {extra}/>'


def ellipse(cx, cy, rx, ry, fill, extra=''):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}" {extra}/>'


def circle(cx, cy, r, fill, extra=''):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" {extra}/>'


def rect(x, y, w, h, r, fill, extra=''):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" {extra}/>'


def line(x1, y1, x2, y2, color, sw=3):
    return f'<path d="M{x1} {y1}L{x2} {y2}" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round"/>'


def group(content, transform='', extra=''):
    return f'<g transform="{transform}" {extra}>{content}</g>'


def eye(x, y, r=3.4):
    return ellipse(x, y, r, r*1.15, INK) + circle(x-0.8, y-1, 0.9, '#FFFFFF')


def star(cx, cy, radius, fill, rotation=-90):
    coords=[]
    for i in range(10):
        a=math.radians(rotation+i*36)
        r=radius if i%2==0 else radius*.48
        coords.append((cx+math.cos(a)*r,cy+math.sin(a)*r))
    d='M'+'L'.join(f'{x:.2f} {y:.2f}' for x,y in coords)+'Z'
    return path(d, fill, fill, 6)


def defs():
    gradients = {
        'apple': ('#F48B73', '#DF594C'), 'orange': ('#FFBF6B', '#ED8B3C'),
        'gold': ('#FFE396', '#EDBE5A'), 'green': ('#A8C68B', '#709E71'),
        'leaf': ('#89B38C', '#477E62'), 'purple': ('#BAA2D0', '#8C72B3'),
        'blue': ('#A3C8D7', '#6A9CAE'), 'pink': ('#EDADB0', '#D78291'),
        'fur': ('#EABF8C', '#C99464'), 'fox': ('#EEA76D', '#D97E46'),
        'paper': ('#FFFBED', '#EEE1C4'), 'grey': ('#B1C6C8', '#819FA3'),
        'brown': ('#BD9876', '#967350'),
    }
    s='<defs>'
    for name,(light,dark) in gradients.items():
        s+=f'<linearGradient id="{name}" x1="0" y1="0" x2=".75" y2="1"><stop stop-color="{light}"/><stop offset="1" stop-color="{dark}"/></linearGradient>'
    s+='<filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#394E43" flood-opacity=".1"/></filter>'
    s+='<filter id="soft" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#394E43" flood-opacity=".08"/></filter></defs>'
    return s


def save(name, label, body, width=240, height=240):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{escape(label)}"><title>{escape(label)}</title>{defs()}{body}</svg>\n'
    (OUT / f'{name}.svg').write_text(svg)


def ground(y=206, rx=62):
    return ellipse(120, y, rx, 7, '#52755B', 'opacity=".07"')


def leaf(x,y,scale=1,rotate=0):
    return group(path('M0 0C-1 -22 18 -35 39 -27C39 -5 20 8 0 0Z', 'url(#leaf)')+path('M2 -1L28 -20','none','#4C7F60',1.5),f'translate({x} {y}) rotate({rotate}) scale({scale})')

# FRUIT — familiar silhouettes with gentle dimensional light.
save('apple','A red apple with a green leaf',ground()+group(
    path('M121 63C99 48 57 55 49 91C39 130 65 188 94 193C105 195 111 189 120 190C130 189 137 195 149 192C178 185 203 129 191 91C181 58 146 49 121 63Z','url(#apple)')+
    path('M120 66C116 52 120 39 125 30','none','#8A6B47',9)+leaf(127,49,.8,-2)+
    path('M66 90C70 75 82 70 93 72','none','#FFD1B6',8)+ellipse(73,109,4,6,'#FFD1B6','opacity=".7"'),extra='filter="url(#shadow)"'))

save('banana','A curved yellow banana',ground()+group(
    path('M49 59C50 130 93 169 164 151C179 147 194 137 202 126C197 162 167 189 128 193C68 199 27 151 34 94C36 79 41 66 49 59Z','url(#gold)')+
    path('M49 59C50 124 90 163 158 149C136 168 91 164 69 144C44 120 39 86 49 59Z','#FFF0B5')+
    path('M47 59L46 45','none','#92744C',10)+path('M197 131L204 124','none','#92744C',8)+
    path('M43 108C48 157 87 184 131 181','none','#DEB455',3),extra='filter="url(#shadow)"'))

save('orange','An orange fruit with a green leaf',ground()+group(
    circle(120,128,72,'url(#orange)')+leaf(125,61,.95,-12)+path('M120 64L119 47','none','#8A6B47',6)+
    path('M67 112C72 92 88 79 106 78','none','#FFE1A2',8)+
    ''.join(circle(x,y,r,'#DC8037','opacity=".25"') for x,y,r in [(155,137,2),(173,115,1.5),(152,163,1.7),(174,146,1.6),(133,176,2),(99,173,1.5)]),extra='filter="url(#shadow)"'))

strawberry=path('M117 63C99 52 60 62 53 89C43 120 80 174 112 194C116 197 123 197 128 193C161 173 197 122 187 88C180 62 140 53 117 63Z','url(#apple)')
strawberry+=path('M120 73L88 49L95 73L66 76L100 90L118 76L139 94L146 75L176 73L150 57L133 69L126 42Z','url(#leaf)')
strawberry+=path('M122 65L126 39','none','#547F54',5)
for x,y,a in [(77,102,-18),(105,106,-4),(139,107,8),(164,102,20),(86,129,-16),(120,130,0),(153,129,16),(103,153,-12),(137,153,12),(120,176,0)]:
    strawberry+=ellipse(x,y,2.3,4.6,'#FFE4A7',f'transform="rotate({a} {x} {y})"')
save('strawberry','A red strawberry with seeds and green leaves',ground()+group(strawberry,extra='filter="url(#shadow)"'))

grapes=path('M119 64C118 43 128 36 136 36','none','#827347',6)+leaf(118,57,1,7)
for x,y,r in [(89,80,27),(142,79,27),(67,117,27),(116,119,29),(166,117,27),(92,157,28),(142,157,28),(118,188,25)]:
    grapes+=circle(x,y,r,'url(#purple)')+ellipse(x-9,y-11,7,4,'#EEE0F8','opacity=".6" transform="rotate(-30 '+str(x-9)+' '+str(y-11)+')"')
save('grapes','A bunch of purple grapes with a green leaf',ground(218,56)+group(grapes,extra='filter="url(#shadow)"'))

save('pear','A green pear with a brown stem',ground()+group(
    path('M119 49C100 49 95 68 93 85C90 104 68 117 61 141C51 177 74 202 119 203C163 203 190 177 178 143C171 119 150 107 146 85C143 66 140 49 119 49Z','url(#green)')+
    path('M119 53C118 39 120 31 128 25','none','#8B7049',7)+leaf(125,46,.7,-12)+
    path('M83 132C75 143 72 156 75 168','none','#DCE8B3',9)+
    ''.join(circle(x,y,1.3,'#6C8B51','opacity=".3"') for x,y in [(139,158),(151,172),(125,181),(143,187),(154,150)]),extra='filter="url(#shadow)"'))

# ANIMALS — body cues remain explicit, separate species, expressive but not busy.
cat=path('M168 159C207 180 209 123 191 115','none','#CC9564',18)
cat+=ellipse(121,157,48,45,'url(#fur)')+ellipse(121,165,29,29,'#F9E7CB')
cat+=ellipse(91,196,22,11,'#D5A374')+ellipse(150,196,22,11,'#D5A374')
cat+=path('M65 87L64 37Q66 29 73 35L102 60Q121 52 139 60L166 35Q173 30 175 40L175 91Z','url(#fur)')
cat+=path('M75 70L75 46L93 64Z','#E2AAA0')+path('M146 65L165 46L163 73Z','#E2AAA0')
cat+=ellipse(120,92,60,48,'url(#fur)')+ellipse(101,108,22,17,'#FFF0D6')+ellipse(139,108,22,17,'#FFF0D6')
cat+=eye(95,91)+eye(145,91)+path('M114 104Q120 99 126 104L121 111Q120 112 119 111Z','#9F6D61')
cat+=path('M120 110V116M120 116Q112 123 106 116M120 116Q127 123 134 116','none',INK,2.2)
cat+=path('M115 52L119 67M131 53L128 67M105 56L110 68','none','#BA8656',3)
for x1,y1,x2,y2 in [(80,107,52,103),(80,117,52,121),(160,107,188,103),(160,117,187,121)]:cat+=line(x1,y1,x2,y2,'#A57D58',2)
save('cat','A ginger cat with pointed ears and whiskers',ground(211)+group(cat,extra='filter="url(#shadow)"'))

dog=path('M167 158C190 159 199 146 197 134','none','#A6805F',15)+ellipse(119,157,49,43,'url(#brown)')+ellipse(122,163,28,30,'#F9ECD2')
dog+=ellipse(89,196,24,11,'#A9815D')+ellipse(148,196,24,11,'#A9815D')
dog+=ellipse(120,87,56,49,'url(#fur)')+path('M83 47C61 42 42 61 45 95C47 119 62 129 73 115C81 106 81 82 91 65Z','#967251')+path('M157 47C179 42 198 61 195 95C193 119 178 129 167 115C159 106 159 82 149 65Z','#967251')
dog+=ellipse(123,110,32,22,'#FFF1D8')+eye(101,88)+eye(147,88)+path('M111 101Q124 95 136 101Q136 111 124 113Q112 110 111 101Z',INK)+path('M124 113V120M124 119Q113 127 105 119M124 119Q136 127 143 118','none',INK,2.2)
dog+=path('M121 124Q132 127 137 123L137 135Q128 146 122 135Z','#DF9A99')+path('M84 136Q121 151 157 135','none','#6E9F8A',8)+circle(121,146,7,'#E9BE62')
save('dog','A brown dog with floppy ears and a green collar',ground(211)+group(dog,extra='filter="url(#shadow)"'))

rabbit=ellipse(165,171,20,20,'#F5ECD9')+ellipse(118,164,47,39,'url(#paper)')+ellipse(87,196,25,11,'#EAE0CD')+ellipse(149,196,25,11,'#EAE0CD')
rabbit+=ellipse(94,61,18,48,'url(#paper)','transform="rotate(-12 94 61)"')+ellipse(144,61,18,48,'url(#paper)','transform="rotate(12 144 61)"')
rabbit+=ellipse(94,59,8,34,'#E9B8B3','transform="rotate(-12 94 59)"')+ellipse(144,59,8,34,'#E9B8B3','transform="rotate(12 144 59)"')
rabbit+=ellipse(119,119,56,47,'url(#paper)')+eye(96,116)+eye(142,116)+ellipse(80,130,9,5,'#EFC6BA')+ellipse(157,130,9,5,'#EFC6BA')
rabbit+=path('M113 128Q120 122 127 128L121 134Q119 135 118 133Z','#CC948F')+path('M120 134V139M120 139Q110 146 105 138M120 139Q130 145 135 138','none',INK,2)
save('rabbit','A cream rabbit with long ears and a fluffy tail',ground(211)+group(rabbit,extra='filter="url(#shadow)"'))

lion=path('M162 168C191 186 196 152 186 145','none','#C99550',9)+ellipse(185,143,9,13,'#A57747','transform="rotate(-25 185 143)"')+ellipse(120,167,43,35,'url(#gold)')+ellipse(90,198,22,10,'#DCB463')+ellipse(150,198,22,10,'#DCB463')
lion+=path('M119 24L137 33L156 31L167 47L185 52L188 74L200 88L193 108L197 128L181 142L176 160L156 164L141 179L120 174L101 179L86 164L66 161L61 141L44 127L48 106L41 87L54 72L56 52L77 46L86 30L106 33Z','url(#brown)')
lion+=circle(78,70,14,'#E5BC78')+circle(160,70,14,'#E5BC78')+ellipse(120,101,53,55,'url(#gold)')+ellipse(101,119,22,18,'#FFF0CE')+ellipse(139,119,22,18,'#FFF0CE')+eye(97,97)+eye(144,97)+path('M111 110Q120 105 129 110L123 119Q120 121 117 119Z','#7B5B40')+path('M120 119V126M120 126Q110 133 104 125M120 126Q131 133 137 125','none',INK,2.5)
save('lion','A golden lion with a full brown mane',ground(213)+group(lion,extra='filter="url(#shadow)"'))

elephant=path('M187 130Q213 138 207 158','none','#839FA1',6)+ellipse(132,145,66,47,'url(#grey)')+rect(90,160,27,41,12,'#8DA8AA')+rect(150,160,27,41,12,'#8DA8AA')+ellipse(101,199,16,7,'#A4BCBD')+ellipse(162,199,16,7,'#A4BCBD')
elephant+=ellipse(80,108,42,48,'url(#grey)')+ellipse(118,105,36,46,'#9AB7B9')+ellipse(121,108,26,34,'#BCD0D0')+path('M59 112C51 122 52 157 43 162C33 168 29 158 28 151C20 150 18 158 24 170C38 192 64 177 70 158L80 123Z','url(#grey)')+eye(62,102)+path('M75 127Q62 146 59 130','#FFF3D8')+path('M84 65Q94 55 103 58','none','#8AA6A8',6)
for x in [94,103,153,162]:elephant+=line(x,198,x,191,'#CBDBD8',2)
save('elephant','A grey elephant with large ears and a long trunk',ground(214,82)+group(elephant,extra='filter="url(#shadow)"'))

turtle=path('M49 155L29 149L45 141Z','#83A879')+ellipse(74,174,22,13,'#91B286','transform="rotate(-24 74 174)"')+ellipse(145,177,22,13,'#91B286','transform="rotate(20 145 177)"')+ellipse(179,135,29,25,'url(#green)')+path('M168 145L159 160L181 162L191 151Z','#84AA7C')
turtle+=path('M44 155C43 109 71 79 111 81C154 80 176 112 172 155Q113 178 44 155Z','url(#leaf)')+path('M49 154Q111 177 169 154','none','#B5CA91',8)+path('M84 93L91 121L75 149M136 91L128 121L144 151M91 121L128 121M91 121L78 137M128 121L145 135','none','#A1BC89',3.5)+eye(187,130,3)+path('M192 142Q198 146 202 139','none','#4B7055',2)
save('turtle','A green turtle with a patterned shell',ground(202,80)+group(turtle,extra='filter="url(#shadow)"'))

# COLOURS — identical paint form; hue is the only learning variable.
color_values={'red':('#F08F82','#D9574B'),'orange-color':('#FFC482','#ED963F'),'yellow':('#FFE78E','#F3C34D'),'green':('#9CC395','#5C916B'),'blue':('#A4CDE5','#5E9CC7'),'purple':('#C9B0DE','#9473B5')}
for name,(light,dark) in color_values.items():
    blob=path('M49 89C43 61 72 40 96 49C116 28 148 38 155 58C187 51 211 80 193 108C213 135 197 166 174 169C168 202 131 207 112 187C84 209 56 186 56 163C27 153 27 117 49 106Z',dark)+path('M61 83C61 65 78 56 92 61','none',light,10)+circle(56,103,4,light)+ellipse(119,137,53,42,light,'opacity=".12"')
    save(name,f'{"An" if name == "orange-color" else "A"} {name.replace("-color", "")} paint splash',ground(212)+group(blob,extra='filter="url(#shadow)"'))

# Numerals are rendered separately by scripts/generate-numbers.py.
# Keep the plush bitmap assets; do not regenerate the former dot illustrations.

# SHAPES — clean familiar outlines, no distracting characters.
save('circle','A blue circle',ground(213)+group(circle(120,117,76,'url(#blue)')+path('M65 96C72 75 91 63 109 63','none','#D4E8EB',7),extra='filter="url(#shadow)"'))
save('square','A green square',ground(213)+group(rect(48,45,144,144,2,'url(#green)')+path('M61 90V59H94','none','#D1E0B3',6),extra='filter="url(#shadow)"'))
save('triangle','A golden triangle',ground(213)+group(path('M120 32L210 190H30Z','url(#gold)')+path('M67 151L113 70','none','#FFEDB3',7),extra='filter="url(#shadow)"'))
save('rectangle','A purple rectangle',ground(199)+group(rect(27,65,186,105,2,'url(#purple)')+path('M42 104V80H79','none','#E5D6ED',6),extra='filter="url(#shadow)"'))
save('star','A five-pointed golden star',ground(213)+group(star(120,117,88,'url(#gold)')+path('M108 82L117 64','none','#FFF0B6',7),extra='filter="url(#shadow)"'))
save('heart','A pink heart',ground(213)+group(path('M120 195C100 176 45 144 37 106C22 38 94 29 120 70C146 28 217 39 203 104C195 144 144 176 120 195Z','url(#pink)')+path('M55 93C54 72 73 59 88 65','none','#FBDCD4',7),extra='filter="url(#shadow)"'))

# EVERYDAY WORLD.
sun=''
for a in range(0,360,45):
    rad=math.radians(a)
    sun+=line(round(120+math.cos(rad)*79,2),round(120+math.sin(rad)*79,2),round(120+math.cos(rad)*95,2),round(120+math.sin(rad)*95,2),'#EBBD5C',10)
sun+=circle(120,120,61,'url(#gold)')+path('M77 105Q88 80 108 78','none','#FFF1B6',6)
save('sun','A golden sun with eight rays',group(sun,extra='filter="url(#shadow)"'))
moon=path('M160 41C110 24 56 61 48 108C40 159 76 202 125 202C154 203 184 188 199 163C152 171 118 142 115 104C112 76 131 52 160 41Z','url(#gold)')+path('M66 111Q70 81 92 65','none','#FFF2BC',6)+circle(83,143,8,'#E4B85C','opacity=".5"')+circle(113,177,5,'#E4B85C','opacity=".5"')+star(172,83,17,'#9BBEBD')+star(199,120,9,'#B3CCC5')
save('moon','A golden crescent moon with two small stars',group(moon,extra='filter="url(#shadow)"'))

tree=ground(218,67)+path('M108 132L104 211H137L131 128Z','url(#brown)')+path('M121 177L147 150M119 161L95 143','none','#9A7752',8)+circle(77,118,39,'url(#green)')+circle(163,111,43,'url(#leaf)')+circle(118,69,48,'url(#green)')+circle(113,116,50,'url(#leaf)')+path('M84 66Q97 41 123 42','none','#C4D6A2',6)+leaf(75,197,.55,-28)+path('M78 209L80 198','none','#65916A',3)
save('tree','A leafy green tree with a brown trunk',group(tree,extra='filter="url(#shadow)"'))

flower=ground(215,53)+path('M120 109V210','none','#6C976D',9)+path('M117 177C83 181 60 164 60 145C91 140 110 152 117 177Z','url(#leaf)')+path('M123 158C151 163 174 146 175 129C146 124 129 138 123 158Z','url(#green)')
for a in range(0,360,60):
    rad=math.radians(a)
    x=120+math.cos(rad)*35;y=83+math.sin(rad)*35
    flower+=ellipse(round(x,2),round(y,2),23,31,'url(#pink)',f'transform="rotate({a-90} {x:.2f} {y:.2f})"')
flower+=circle(120,83,28,'url(#gold)')+ellipse(111,73,8,4,'#FFF0B3')
save('flower','A pink flower with a yellow centre and two green leaves',group(flower,extra='filter="url(#shadow)"'))

house=ground(215,86)+rect(51,90,139,113,10,'url(#paper)')+rect(156,42,22,47,5,'#BD9271')+path('M30 101L113 31Q120 25 127 31L210 101Q217 110 206 116L120 48L35 116Q24 111 30 101Z','url(#apple)')+rect(96,136,47,67,8,'url(#leaf)')+circle(133,171,3,'#DCE6B8')+rect(64,119,25,29,5,'url(#blue)')+rect(152,119,25,29,5,'url(#blue)')+line(76.5,119,76.5,148,'#FFF8E8',3)+line(64,133,89,133,'#FFF8E8',3)+line(164.5,119,164.5,148,'#FFF8E8',3)+line(152,133,177,133,'#FFF8E8',3)+rect(90,201,59,7,3,'#B8AE90')
save('house','A cream house with a red roof and a green front door',group(house,extra='filter="url(#shadow)"'))

car=ground(195,92)+path('M35 128L58 119L81 77Q86 69 99 69H145Q157 69 165 80L190 119L207 124Q216 127 216 139V163Q216 173 204 173H36Q24 173 24 161V142Q24 131 35 128Z','url(#blue)')+path('M67 117L88 83Q91 79 99 79H113V117Z','#E6F0EB')+path('M124 79H145Q151 79 155 85L176 117H124Z','#E6F0EB')+line(128,132,142,132,'#407E95',4)+rect(24,138,14,10,4,'#FFF1BC')+rect(203,139,13,10,4,'#E7A18D')+circle(66,173,24,INK)+circle(176,173,24,INK)+circle(66,173,13,'#D3DBCA')+circle(176,173,13,'#D3DBCA')+circle(66,173,5,'#80968B')+circle(176,173,5,'#80968B')
save('car','A blue car with two visible round wheels',group(car,extra='filter="url(#shadow)"'))

# ORIGINAL MASCOT — fox explorer, reusable vector pieces for consistent art direction.
def fox():
    s=path('M230 266C326 276 348 219 312 174C306 207 279 198 267 218C250 242 235 251 230 266Z','url(#fox)')
    s+=path('M312 174C329 196 332 219 320 240Q300 225 291 212C301 204 307 196 312 174Z','#FFF0D5')
    s+=rect(117,208,61,91,24,'url(#leaf)','transform="rotate(-10 117 208)"')+rect(109,230,25,45,10,'#527C5D','transform="rotate(-10 109 230)"')+path('M135 214Q127 197 142 189L159 188','none','#456F55',7)
    s+=path('M152 236C154 204 216 195 237 227L251 294Q253 322 222 327H161Q136 323 142 296Z','url(#fox)')
    s+=ellipse(195,266,31,44,'url(#paper)')+path('M153 240Q136 256 142 281','none','#D98950',19)+path('M235 235Q256 248 253 273','none','#D98950',19)
    s+=ellipse(166,328,25,12,'#855F43')+ellipse(225,328,25,12,'#855F43')
    s+=path('M125 123L119 58Q119 48 131 54L171 87Q196 80 220 88L264 52Q273 46 272 61L263 132Z','url(#fox)')
    s+=path('M135 96L132 68L158 90Z','#885C44')+path('M235 91L259 69L254 101Z','#885C44')
    s+=path('M123 109Q151 82 194 87Q239 83 265 113L279 156Q281 190 245 208L201 226Q193 230 184 226L140 206Q105 188 109 158Z','url(#fox)')
    s+=path('M110 156Q137 138 173 167L193 187L214 166Q249 139 278 157Q281 188 246 207L201 226Q193 230 184 226L141 207Q109 191 110 156Z','url(#paper)')
    s+=eye(153,148,4.2)+eye(235,148,4.2)+path('M183 178Q194 172 205 178L198 189Q194 193 190 189Z',INK)+path('M194 190V197M194 197Q185 205 177 198M194 197Q203 205 211 198','none',INK,2.4)
    s+=ellipse(138,169,11,6,'#EAB799','opacity=".6"')+ellipse(249,169,11,6,'#EAB799','opacity=".6"')
    s+=path('M157 223Q195 242 234 221L231 235Q199 251 158 236Z','#709A80')+path('M217 237L231 268L240 253L233 232Z','#5C896F')
    s+=path('M154 245L151 277','none','#A9BE8F',6)+circle(151,281,4,'#E8C374')
    return s

save('fox-explorer','A friendly little fox explorer wearing a green backpack and scarf',ellipse(199,351,103,10,'#45694B','opacity=".08"')+group(fox(),extra='filter="url(#shadow)"'),400,400)

scene=''
scene+=ellipse(431,275,291,156,'#E4EDDA')+ellipse(562,319,194,109,'#D5E3CE')+path('M57 368Q181 295 306 354Q467 297 747 369L748 440H57Z','#D4E2C6')+path('M128 408Q346 339 725 404L725 449H128Z','#C2D7B4')
# Floating clouds and little exploration stars.
scene+=path('M255 95C234 91 234 70 249 66C248 45 278 39 289 56C305 44 327 54 324 72C348 74 345 97 327 98Z','#FFF9E9')+path('M594 99C577 95 578 78 594 75C595 56 616 51 627 66C643 61 659 72 655 85C673 90 664 104 652 104Z','#F8F5E8')
scene+=star(422,68,14,'#E9BE65')+star(682,183,12,'#E7BE6C')+star(178,204,10,'#F0C87B')+circle(475,111,5,'#89AA87')+circle(232,157,4,'#E0A789')
# Plants around the clearing.
scene+=path('M652 365Q667 309 657 265','none','#719875',7)+leaf(658,302,.95,-25)+leaf(655,336,1.1,-128)+leaf(662,279,.75,-25)
scene+=path('M192 373Q179 334 190 298','none','#83A17B',5)+leaf(183,337,.9,-135)+leaf(185,317,.65,-25)
scene+=path('M701 391Q704 351 723 328','none','#789B6B',4)+leaf(710,358,.65,-30)
scene+=path('M100 386Q91 354 102 336','none','#8FA77F',5)+leaf(96,367,.75,-140)
# Book, blocks, path and fox.
scene+=path('M308 407Q350 390 396 407Q433 390 473 406L472 424Q430 410 395 426Q349 411 309 425Z','#F5E8C9')+path('M308 402Q351 386 395 403V421Q350 404 308 420Z','#FFF9E8')+path('M395 403Q430 386 473 401V419Q433 403 395 421Z','#EFE4C8')+line(395,404,395,422,'#C4BC9B',2)
scene+=rect(544,352,43,42,8,'#EAB771','transform="rotate(7 544 352)"')+rect(583,369,41,40,8,'#96B7A1','transform="rotate(-7 583 369)"')+rect(557,314,39,39,8,'#A3BBC9','transform="rotate(-5 557 314)"')+circle(577,333,9,'#EAF0E6')+star(564,373,9,'#F6DFB4')
scene+=ellipse(417,407,95,10,'#6C895F','opacity=".1"')+group(fox(),'translate(230 58) scale(.95)')
scene+=path('M238 400Q231 386 236 375M238 400Q248 384 253 387','none','#809D71',3)+path('M632 424Q629 408 636 401M632 424Q644 414 648 415','none','#809D71',3)
save('discovery-scene','A little fox explorer with a book and blocks in a warm green garden',scene,800,460)

# App icon remains legible at small sizes.
icon=rect(0,0,192,192,48,'#315D4B')+circle(153,36,6,'#D4BD79')
icon+=group(path('M43 77L40 33Q40 28 47 32L72 52Q96 46 120 52L147 31Q154 27 152 35L149 79Z','url(#fox)')+path('M51 60L50 42L65 55Z','#855C43')+path('M128 56L142 43L140 65Z','#855C43')+path('M43 70Q62 49 95 51Q132 49 149 74L158 102Q162 126 136 139L101 155Q96 158 90 155L57 139Q31 126 35 102Z','url(#fox)')+path('M35 103Q54 89 80 111L96 126L112 111Q137 90 159 103Q160 127 136 139L101 155Q96 158 90 155L57 139Q33 126 35 103Z','url(#paper)')+eye(66,97,3.6)+eye(126,97,3.6)+path('M87 120Q96 115 105 120L99 128Q96 131 93 128Z',INK)+path('M96 129V134M96 134Q90 140 84 135M96 134Q103 140 109 135','none',INK,2),'translate(0 8)')
(OUT.parent/'icon.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192" role="img" aria-label="Little Explorer fox app icon"><title>Little Explorer fox app icon</title>{defs()}{icon}</svg>\n')
print(f'Created {len(list(OUT.glob("*.svg")))} illustrations and public/icon.svg')
