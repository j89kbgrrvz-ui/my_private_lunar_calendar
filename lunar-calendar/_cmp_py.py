import lunardate
evs = [('yuanxiao',1,15,False),('sanyue',3,3,False),('liuyue',6,6,False)]
out = []
for (id_,m,d,leap) in evs:
    for y in range(2024,2075):
        try:
            sd = lunardate.LunarDate(y,m,d,leap).toSolarDate()
            out.append(f"{id_}|{y}|{sd.strftime('%Y-%m-%d')}")
        except Exception as e:
            out.append(f"{id_}|{y}|NULL")
# leap test
try:
    sd = lunardate.LunarDate(2023,2,15,True).toSolarDate(); out.append('leaptest|2023|'+sd.strftime('%Y-%m-%d'))
except Exception as e:
    out.append('leaptest|2023|NULL')
try:
    sd = lunardate.LunarDate(2024,2,15,True).toSolarDate(); out.append('leaptest|2024|'+sd.strftime('%Y-%m-%d'))
except Exception as e:
    out.append('leaptest|2024|NULL')  # lunardate raises ValueError for nonexistent leap
with open('_py.csv','w') as f:
    f.write('\n'.join(out))
print("py csv lines:", len(out))
