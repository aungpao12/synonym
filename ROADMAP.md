# แนวทางต่อยอด Word Garden

สำรวจแหล่งข้อมูลวันที่ 18 ตุลาคม 2026 — ยังไม่ได้เชื่อม API หรือเพิ่ม pool ภายนอกลงในแอป

## ฟังก์ชันที่น่าสนใจ

1. **Spaced repetition / คำที่ยังจำไม่ได้**: ให้ผู้เล่นกดจำได้/ยังจำไม่ได้ แล้วจัดรอบทบทวน ปิดประวัติการเรียนใน Surprise ตามหลักไม่เก็บคะแนน
2. **ตัวลวงตามชนิดคำและความหมาย**: เลือกชนิดคำเดียวกัน แต่ห้ามใช้ synonym ใน sense เดียวกันเป็นตัวลวง เพิ่มความท้าทายและลดข้อที่ตอบถูกได้หลายตัวเลือก
3. **ฟังเสียงและประโยคตัวอย่าง**: ปุ่มฟังคำพร้อมบริบท แยกความหมายของคำที่มีหลาย sense
4. **หมวด / ชุดส่วนตัว**: แยก Academic, Everyday, Medical พร้อมเลือกหลายหมวดเป็น pool
5. **นำเข้า CSV/TSV**: วางตารางจาก Excel/Google Sheets ตรวจคำซ้ำและตัวอย่างก่อนบันทึก
6. **PWA / เล่นออฟไลน์**: เพิ่ม manifest และ service worker ที่มีขั้นตอนอัปเดตชัดเจน ไม่ล้างคำศัพท์ส่วนตัว
7. **โหมดกลับด้านและพิมพ์คำตอบ**: สลับคำศัพท์ 1/2 หรือฝึกเรียกคำจากความจำ

## แหล่งข้อมูล

### Open English Wordnet (แนะนำเป็น pool หลัก)

- เว็บไซต์/ดาวน์โหลด: https://en-word.net/downloads
- โค้ดและคำอธิบาย: https://github.com/globalwordnet/english-wordnet
- License: https://github.com/globalwordnet/english-wordnet/blob/main/LICENSE.md
- มี synset สำหรับความหมายเฉพาะ และชนิดคำ รวมถึงไฟล์ JSON ของรุ่น 2025
- เหมาะกับการคัด pool ล่วงหน้า แปลงเป็น JSON ขนาดเล็กที่ใช้กับเว็บ static ได้ โดยไม่ต้องเรียก API ทุกข้อ
- ต้องใส่ attribution ให้ Princeton WordNet และ Open English Wordnet ตามใบอนุญาต ไม่ใช่ฐานคำแปลไทย

### Datamuse

- เอกสาร: https://www.datamuse.com/api/
- rel_syn ค้นคำพ้องใน WordNet synset; md=d ขอ definitions, md=p ขอ parts of speech
- เหมาะกับปุ่มแนะนำ synonym เมื่อเพิ่มคำ มากกว่าสร้างโจทย์ทันทีจากทุกผลลัพธ์
- เอกสารประกาศการเปลี่ยนไปใช้ API key ในปี 2027 โดยวันเริ่มต้นที่ส่วนหัวกับ Usage limits ไม่ตรงกัน ควรยืนยันกับผู้ให้บริการก่อนใช้เป็น dependency ระยะยาว
- ควรใส่ attribution และไม่ฝัง key ลับไว้ในเว็บ GitHub Pages

### Free Dictionary API

- เอกสาร: https://dictionaryapi.dev/
- โครงการ: https://github.com/meetDeveloper/freeDictionaryAPI
- มีคำจำกัดความภาษาอังกฤษ ชนิดคำ phonetics/เสียง และช่อง synonyms/antonyms แต่ coverage และความครบของแต่ละรายการไม่เท่ากัน
- เหมาะเป็นข้อมูลประกอบการเพิ่มคำและตัวอย่างการใช้ มากกว่าฐาน synset ที่ครบถ้วน

### Kaikki / Wiktionary

- https://kaikki.org/dictionary/English/
- มีข้อมูล machine-readable จำนวนมาก เหมาะกับ ETL ล่วงหน้า แต่ไฟล์ใหญ่และต้องกรองคุณภาพ ชนิดคำ sense และเงื่อนไขการใช้ข้อมูลตามแหล่งต้นทาง

## การออกแบบที่แนะนำ

ใช้ Open English Wordnet เป็นโครงกลุ่ม synonym โดยเก็บ `synset_id`, `part_of_speech`, `definition_en`, `example_en`, `source`, `license` เพิ่มจากสามช่องหลักของแอป คัดระดับความยากก่อนสร้าง pool แล้วจัดคำแปลไทยและคำอ่านไทยเป็นข้อมูลที่ผ่านการตรวจทาน แสดงตัวอย่างให้ผู้ใช้ยืนยันก่อนนำเข้าคลังส่วนตัว ไม่ถือว่าคำที่ใกล้เคียงกันทุกคำใช้แทนกันได้ทุกบริบท
