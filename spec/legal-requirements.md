# Wymogi prawne ewidencji magazynowej (warehouse-wms)

- **Data:** 2026-10-18
- **Status:** research, nie porada prawna
- **Zakres:** Symfonia FK zostaje; KSeF poza zakresem; WMS = wartościowa ewidencja magazynowa FIFO; przesunięcia MM magazyn centralny ↔ kawiarnie (kawiarnie jako osobne magazyny); przyjęcia PZ na podstawie FV zakupowych.

---

# Wymagania prawne dla ewidencji magazynowej w warehouse-wms przy wycenie FIFO (stan prawny na 18.10.2026)

Zakres jest zawężony zgodnie z decyzją użytkownika: zostaje Symfonia FK, KSeF odpada, a WMS ma prowadzić **wartościową** ewidencję magazynową. Przyjęcia są wyceniane z FV zakupowych, a rozchody i przesunięcia MM metodą FIFO. Kawiarnie są osobnymi magazynami.

*To nie jest porada prawna ani podatkowa. Kluczowe decyzje są w sekcji 7 i trzeba je potwierdzić z główną księgową lub biegłym rewidentem.*

---

## 0. Werdykt w skrócie

**Co jest wymagane prawem**, jeśli WMS przejmuje od Symfonii Handel ewidencję magazynową:
- Staje się **księgą pomocniczą** w rozumieniu ustawy o rachunkowości (art. 13 ust. 1 pkt 3 i ust. 2, art. 17). Muszą go więc dotyczyć wymogi dla ksiąg prowadzonych komputerowo:
  - trwałość zapisów i brak możliwości ich edycji (art. 23),
  - sprawdzalność i ciągłość (art. 13 ust. 5, art. 24),
  - korekty tylko dokumentem korygującym (art. 25),
  - dowody z wymaganymi elementami (art. 21),
  - dokumentacja systemu (art. 10),
  - ochrona i archiwizacja (art. 71–74).
- Przy metodzie ilościowo-wartościowej (art. 17 ust. 2 pkt 1) WMS **musi znać ceny i wartości**. W obecnym kształcie, bez cen, ten wymóg nie jest spełniony.
- Na żądanie organu podatkowego WMS musi wygenerować **JPK_MAG**: dziś w wersji (1), a za okresy od 1.01.2027 w wersji (2). Termin to co najmniej 3 dni od wezwania. Plik jest osobny dla każdego magazynu.
- **JPK_KR_PD i JPK_ST_KR generuje FK**, nie WMS. Zapisy przekazywane z WMS do FK muszą jednak dać się prześledzić aż do pojedynczych dowodów PZ, MM i RW.
- **Inwentaryzacja**: spis z natury z wyceną i protokołem, a różnice trzeba rozliczyć w księgach roku, którego dotyczy inwentaryzacja (art. 26–27).

**Dobra praktyka (nie wynika wprost z przepisów)**:
- ciągła numeracja bez luk w każdej serii,
- blokada zamkniętych miesięcy zsynchronizowana z FK,
- automatyczne uzgodnienie stanu WMS z saldem kont zespołu 3,
- ewidencja pozabilansowa wyposażenia,
- dziennik zdarzeń z kontrolą integralności,
- testy odtwarzania kopii zapasowych.

**KSeF**: poza zakresem. Jedyna uwaga to opcjonalne pole na numer KSeF faktury zakupu przy PZ, bo JPK_MAG(2) ma pole `NrKSeFPZ`.

---

## 1. Ustawa o rachunkowości: wartościowa ewidencja magazynowa

Obecny tekst jednolity to **Dz.U. 2026 poz. 522** (obwieszczenie z 30.03.2026, ogłoszone 16.04.2026). Starsze źródła powołują Dz.U. 2023 poz. 120.

### 1.1 Wybór metody ewidencji (art. 17 ust. 2)

Kierownik jednostki wybiera dla każdej grupy rzeczowych aktywów obrotowych jedną z czterech metod:

| Pkt | Metoda | Uwagi |
|---|---|---|
| 1 | ilościowo-wartościowa | wymagana przy FIFO na poziomie pozycji |
| 2 | wyłącznie ilościowa | wycena stanu co najmniej na koniec okresu rozliczeń z podatku dochodowego |
| 3 | wartościowa | tylko dla punktów detalicznych |
| 4 | odpis w koszty w dniu zakupu | ze spisem i korektą kosztów najpóźniej na dzień bilansowy |

Wnioski:
- FIFO na poziomie pozycji oznacza **metodę 1**. Decyzja musi być zapisana w polityce rachunkowości (art. 10).
- Metoda 4 jest prawnie dopuszczalna i dla części asortymentu (np. drobnych materiałów, dekoracji) może być tańsza. To decyzja dla księgowej.
- Ewidencja tylko ilościowa (metoda 2), czyli obecny stan WMS, też jest dopuszczalna. Stan trzeba wtedy wycenić co najmniej na koniec roku. Wybraliście jednak FIFO, więc dalej zakładam metodę 1.

### 1.2 Cena nabycia (art. 28 ust. 2 i ust. 11, art. 34 ust. 1)

- Zapasy ujmuje się w dniu nabycia według ceny nabycia (art. 28 ust. 11 pkt 1).
- **Cena nabycia** obejmuje:
  - kwotę należną sprzedającemu bez VAT podlegającego odliczeniu i bez akcyzy,
  - przy imporcie: cła i inne obciążenia publicznoprawne,
  - koszty bezpośrednio związane z zakupem, łącznie z **transportem, załadunkiem, wyładunkiem i składowaniem**,
  - pomniejszenie o **rabaty, opusty i odzyski**.
- **Uproszczenie z art. 34 ust. 1 pkt 1**: materiały i towary można wyceniać w **cenie zakupu**, czyli bez kosztów transportu, jeśli nie zniekształca to obrazu aktywów i wyniku. Trzeba to zapisać w polityce rachunkowości. W praktyce przesądza to, czy WMS potrzebuje rozdzielania kosztów dodatkowych (landed cost) na pozycje PZ.
- **Ceny ewidencyjne (art. 34 ust. 2)** są alternatywą dla cen rzeczywistych, ale wymagają rozliczania odchyleń. Przy FIFO w praktyce się ich nie stosuje.
- **Wycena na dzień bilansowy**: nie wyżej niż cena sprzedaży netto (art. 28 ust. 1 pkt 6). Odpisy aktualizujące księguje się w pozostałych kosztach operacyjnych (art. 34 ust. 5). Zwykle robi to FK, ale WMS powinien umieć wskazać zalegające partie FIFO (raport wiekowania).
- **Waluty**: dowód w walucie obcej musi zawierać przeliczenie na PLN po kursie z dnia operacji. Wynik przelicza się na dowodzie albo automatycznie w systemie, potwierdzając to wydrukiem (art. 21 ust. 3). Sposób wyboru kursu reguluje art. 30 ust. 2. **Treść art. 30 przywołuję z pamięci, nie sprawdziłem jej** (zwykle jest to średni kurs NBP z dnia poprzedzającego). Księgowa powinna potwierdzić, jaki kurs stosuje FK, bo WMS musi stosować ten sam.
- **Korekty faktur zakupu**: przepisy nie mówią, jak rozliczyć zmianę ceny po rozchodzie. W praktyce i w polityce rachunkowości przyjmuje się:
  - jeśli partia FIFO jest jeszcze na stanie, koryguje się wartość tej partii,
  - jeśli partia została już rozchodowana, różnica idzie proporcjonalnie na rozchód (koszt lub magazyn docelowy przy MM) i na pozostały stan,
  - albo, przy nieistotnych kwotach, różnica idzie w całości w koszty okresu (zasada istotności, art. 4 ust. 4).

  Wybór sposobu trzeba ustalić z księgową. WMS potrzebuje do tego osobnego dokumentu korekty wartości, który nie zmienia ilości.

### 1.3 FIFO (art. 34 ust. 4 pkt 2)

- Rozchód wycenia się kolejno po cenach składników nabytych najwcześniej. FIFO jest jedną z czterech metod, obok średniej ważonej, LIFO i identyfikacji szczegółowej.
- Ustawa **nie określa, czy FIFO liczy się na poziomie całej jednostki, czy każdego magazynu**. Rozsądnie jest prowadzić partie na poziomie pozycji i magazynu:
  - MM przenosi partie razem z ich datą i ceną nabycia,
  - MM nie zmienia wartości łącznej i nie generuje wyniku.

  Zasadę trzeba opisać w polityce rachunkowości.
- **Identyfikacja szczegółowa (art. 34 ust. 4 pkt 4)** może lepiej pasować do drogich pozycji z numerem seryjnym, takich jak ekspresy czy lodówki.

### 1.4 Dowody: PZ, MM, RW, WZ (art. 20–22)

- **Elementy obowiązkowe (art. 21 ust. 1)**:
  1. rodzaj i numer dowodu,
  2. strony operacji (nazwy, adresy),
  3. opis operacji i wartość, a jeśli to możliwe także ilość,
  4. data operacji, a przy innej dacie sporządzenia również data sporządzenia,
  5. **podpis wystawcy i osoby, która wydała lub przyjęła składnik aktywów**,
  6. dekretacja (miesiąc i sposób ujęcia) z podpisem.
- Dekretację można pominąć, jeśli wynika to z techniki zapisów (art. 21 ust. 1a pkt 2). W praktyce dekretację nadaje FK albo reguła mapowania typu dokumentu na konto.
- **Wartość można pominąć na samym dowodzie (art. 21 ust. 2)**, jeśli system wycenia ilości w toku przetwarzania i potwierdza to wydrukiem. Wydruk MM dla kierowcy lub kawiarni może więc być bez cen, o ile system przechowuje wycenę i umie ją wydrukować.
- **Podpisów nie można zastąpić „znakami”** na dowodach dokumentujących przekazanie lub przyjęcie składnika (art. 21 ust. 4). Dla MM, WZ i RW potrzebny jest prawdziwy podpis odbierającego. O podpisie na tablecie piszę w sekcji 6.
- **Dowody zbiorcze (art. 20 ust. 3 pkt 1)** są dozwolone, ale muszą wymieniać pojedynczo każdy dowód źródłowy. Ma to znaczenie dla zestawień przekazywanych do FK.
- **Dowody tworzone automatycznie w systemie (art. 20 ust. 5)** są równoważne dowodom źródłowym, jeśli spełniają cztery warunki:
  - mają trwale czytelną postać,
  - można ustalić źródło i osobę wprowadzającą,
  - istnieje kontrola kompletności i identyczności zapisów,
  - dane źródłowe są chronione przed zmianą przez cały okres przechowywania.
- **Zakaz przeróbek (art. 22 ust. 1)**: dowodów nie wolno poprawiać po zatwierdzeniu. W systemie korekta odbywa się dokumentem korygującym.
- **PZ powiązane z FV**: z przepisów i z JPK_MAG wynikają pola dostawca, data otrzymania, numer i data faktury lub specyfikacji, ilość, jednostka miary, cena i wartość. Rozjazdy w czasie między PZ a FV (towar bez faktury, faktura bez towaru) rozlicza FK na koncie 30 „Rozliczenie zakupu”. Kolejność obsługi trzeba ustalić z księgową.

### 1.5 Wymagania dla systemu komputerowego (art. 13, 23, 24, 25)

- **Art. 13 ust. 3**: system musi pozwalać wydrukować lub wyeksportować czytelne zapisy.
- **Art. 13 ust. 4**: wydruki trzeba oznaczać:
  - nazwą jednostki,
  - nazwą księgi,
  - **nazwą programu**,
  - rokiem i okresem,
  - datą sporządzenia.
- **Art. 13 ust. 5**: wymagana jest automatyczna kontrola ciągłości zapisów i przenoszenia obrotów. Wydruki mają numerowane strony i sumy narastające.
- **Art. 13 ust. 6**: księgi trzeba wydrukować albo zapisać na trwałym nośniku najpóźniej na koniec roku.
- **Art. 23 ust. 1 i 5**: zapisy muszą być trwałe, a system ma chronić przed ich zniszczeniem, modyfikacją lub ukryciem.
- **Art. 23 ust. 2**: elementy zapisu to data operacji, rodzaj i numer dowodu, opis (kody wymagają pisemnych objaśnień), kwota i data zapisu oraz konto.
- **Art. 24**: zapisy muszą być rzetelne, bezbłędne, sprawdzalne i bieżące. W szczególności:
  - od każdego zapisu da się dojść do dowodu na każdym etapie przetwarzania,
  - zapisy są ułożone chronologicznie,
  - istnieje kontrola kompletności zbiorów i parametrów przetwarzania,
  - dane za dowolny okres są dostępne w dowolnym czasie.
- **Art. 25**: w systemie komputerowym i po zamknięciu miesiąca poprawka jest możliwa **tylko dokumentem korygującym z zapisami wyłącznie dodatnimi albo wyłącznie ujemnymi**. Wasz model z zapisami tylko dopisywanymi i stornem jest z tym zgodny. Trzeba przyjąć jedną konwencję storna (czerwone albo czarne), uzgodnioną z FK.

### 1.6 Dokumentacja systemu (art. 10 ust. 1 pkt 3 lit. b–c i pkt 4, ust. 2)

Kierownik jednostki zatwierdza na piśmie i aktualizuje dokumentację, która musi zawierać:
- wykaz zbiorów danych tworzących księgi, z ich strukturą, powiązaniami i funkcją (w praktyce schemat bazy z opisem tabel ruchów, partii FIFO i dokumentów),
- opis systemu informatycznego:
  - wykaz programów, procedur i funkcji,
  - **opis algorytmów i parametrów**, czyli FIFO, rozdzielanie kosztów dodatkowych, korekty wartości i zaokrąglenia,
  - zasady ochrony danych i metody zabezpieczenia dostępu,
  - **wersję oprogramowania i datę rozpoczęcia jego eksploatacji**,
- opis systemu ochrony danych i zbiorów.

Przy aplikacji rozwijanej w firmie oznacza to rejestr wersji (tagi wydań z datą wdrożenia produkcyjnego) i aktualizację dokumentacji przy każdej zmianie algorytmu wyceny. Dokumentację przechowuje się co najmniej 5 lat po utracie jej ważności (art. 74 ust. 2 pkt 5).

### 1.7 Ochrona i archiwizacja (art. 71–74)

- **Art. 71 ust. 2**: wymagane są:
  - nośniki odporne na zagrożenia,
  - ochrona zewnętrzna,
  - **systematyczne kopie zapasowe** z trwałością zapisu przez cały okres przechowywania,
  - ochrona programów i danych przed nieupoważnionym dostępem lub zniszczeniem.
- **Okresy przechowywania (art. 74 ust. 2–3)**, liczone od początku roku następującego po roku obrotowym:

| Zbiór | Okres |
|---|---|
| księgi | 5 lat |
| dowody księgowe | 5 lat |
| dokumenty inwentaryzacyjne | 5 lat |
| dokumentacja zasad rachunkowości | 5 lat od utraty ważności |
| dokumenty reklamacyjne | 1 rok od rozliczenia |

- **Okres podatkowy jest dłuższy**: dane trzeba trzymać do przedawnienia zobowiązania podatkowego (art. 86 w związku z art. 70 Ordynacji podatkowej, czyli 5 lat od końca roku, w którym minął termin płatności podatku). Dla CIT za rok 2026 daje to w praktyce koniec 2032 r. Zalecam przyjąć **co najmniej 6 lat** i nie usuwać danych bez zgody księgowości.
- **Art. 11 ust. 2** wymaga zgłoszenia, gdy księgi prowadzi zewnętrzne biuro rachunkowe. Hosting w chmurze sam w sobie nie jest powierzeniem prowadzenia ksiąg. Jeśli jednak WMS jest hostowany zewnętrznie, potrzebna jest umowa powierzenia przetwarzania danych osobowych (RODO), a dostęp do danych musi być zapewniony.

### 1.8 Inwentaryzacja (art. 26–27)

- **Spis z natury** rzeczowych aktywów obrotowych i środków trwałych odbywa się na ostatni dzień roku (art. 26 ust. 1 pkt 1). Obejmuje spis ilości, **wycenę**, porównanie z księgami oraz wyjaśnienie i rozliczenie różnic.
- **Terminy uważa się za dotrzymane (art. 26 ust. 3)**, jeśli:
  - spis rozpoczęto nie wcześniej niż 3 miesiące przed końcem roku, a zakończono do 15 stycznia, z doliczeniem i odliczeniem ruchów od daty spisu (stanu księgowego nie ustala się po dniu bilansowym),
  - zapasy w **strzeżonych składowiskach** z ewidencją ilościowo-wartościową spisano raz na 2 lata,
  - środki trwałe na **terenie strzeżonym** spisano raz na 4 lata.
- Czy magazyn centralny jest „strzeżonym składowiskiem”, musi ocenić księgowa. Kawiarnie raczej nim nie są.
- **Składniki obce** (np. ekspresy w leasingu lub wypożyczone od palarni) też trzeba spisać i powiadomić właściciela o wyniku (art. 26 ust. 2).
- **Dokumentacja i rozliczenie (art. 27)**: wyniki trzeba udokumentować i powiązać z księgami. Różnice wyjaśnia się i rozlicza **w księgach roku, na który przypadał termin inwentaryzacji**.
- WMS powinien więc dawać:
  - arkusze spisowe z numeracją,
  - protokół z podpisami komisji i osoby materialnie odpowiedzialnej,
  - zestawienie różnic **wycenione z partii FIFO** (niedobór zdejmuje najstarsze partie, nadwyżka wchodzi jako nowa partia po cenie ustalonej w polityce),
  - powiązanie z dokumentem korygującym stan,
  - możliwość „zamrożenia” stanu na datę spisu.
- Kompensatę niedoborów nadwyżkami przy zamiennikach dopuszcza się zwykle w polityce, nie w ustawie.

---

## 2. Środki trwałe, wyposażenie i zapasy: która ewidencja do czego

Dla asortymentu kawiarni (meble, lampy, lodówki, ekspresy, płytki, dekoracje, sprzęt eventowy) to najważniejsza kwestia.

| Kategoria | Definicja i podstawa | Ewidencja | Inwentaryzacja |
|---|---|---|---|
| **Środek trwały** | art. 3 ust. 1 pkt 15: kompletny, zdatny do użytku, z okresem użyteczności powyżej roku, do użytku własnego | ewidencja ŚT (art. 17 ust. 1 pkt 1 UoR, art. 9 ust. 1 i art. 16d ust. 2 CIT), z symbolem KŚT, dokument OT, raport JPK_ST_KR | spis z natury co rok; teren strzeżony co 4 lata (art. 26 ust. 3 pkt 3) |
| **Niskocenny ŚT / wyposażenie** | art. 32 ust. 6 UoR (uproszczone odpisy, także jednorazowe); art. 16d ust. 1 CIT (do **10 000 zł** wydatek w koszty w miesiącu oddania do używania) | po spisaniu w koszty jest **poza bilansem**; ewidencja pozabilansowa jest **dobrowolna**, określona w polityce (KSR 11 pkt 8.32) | ustawa nie wymaga; dobrowolny spis według polityki |
| **Zapasy: materiały i towary** | rzeczowe aktywa obrotowe; materiały na własne potrzeby, towary do odsprzedaży | art. 17 ust. 2 (jedna z czterech metod); konta 31 i 33 | co rok; strzeżone składowisko z ewidencją ilościowo-wartościową co 2 lata; **JPK_MAG** |

Konsekwencje dla WMS:
1. **JPK_MAG dotyczy tylko rzeczowych aktywów obrotowych.** Środki trwałe i wyposażenie oddane do używania do niego nie wchodzą. Środki trwałe trafiają do JPK_ST_KR, który generuje moduł środków trwałych w FK. Z interpretacji 0111-KDIB2-1.4010.106.2026.1.AJ wynika, że niskocenne składniki spisane w koszty na podstawie art. 16d ust. 1 i nieujęte w ewidencji ŚT **nie trafiają do JPK_ST_KR**.
2. **Moment zmiany kategorii.** Lodówka kupiona do kawiarni i czekająca w magazynie centralnym:
   - albo jest na koncie materiałów (31) do czasu wydania, a wtedy RW lub OT,
   - albo od razu idzie przez OT lub środki trwałe w budowie.

   To decyzja polityki rachunkowości. W WMS każda pozycja i partia potrzebuje **klasy bilansowej**: zapas bilansowy, środek trwały (numer inwentarzowy, powiązanie z OT w FK) albo wyposażenie pozabilansowe.
3. **Kawiarnia jako magazyn czy jako rozchód w koszty.** Jeśli przedmiot w kawiarni:
   - **leży jako zapas** (np. zapasowe płytki, dekoracje sezonowe w magazynku), to przesunięcie jest **MM**, a składnik pozostaje zapasem i wchodzi do JPK_MAG kawiarni jako osobnego magazynu;
   - **zostaje oddany do używania**, to przesunięcie jest **RW** (rozchód w koszty, wyposażenie) albo **OT** (środek trwały), a składnik **wychodzi z ewidencji zapasów**.

   Dalsze śledzenie lokalizacji jest wtedy ewidencją pozabilansową albo ewidencją ŚT, bez wartości bilansowej zapasu. Obecne „wydanie do kawiarni z podpisem” jest więc prawnie dwiema różnymi operacjami.
4. **Zwrot z kawiarni** zużytego przedmiotu wcześniej spisanego w koszty **nie przywraca zapasu bilansowego**. Wraca tylko do ewidencji pozabilansowej, chyba że polityka przewiduje przyjęcie po wartości odzysku, co daje przychód.
5. **Sprzedaż sprzętu lub wydanie dostawcy** (batch issue): WZ to wydanie na zewnątrz, z dokumentacją sprzedaży w Symfonii. Naprawa u serwisu to przekazanie bez zmiany własności, które wymaga potwierdzenia salda (art. 26 ust. 1 pkt 2, „powierzone kontrahentom”).

---

## 3. JPK: harmonogram 2025–2027 i co musi umieć WMS

### 3.1 JPK_MAG (na żądanie, art. 193a Ordynacji podatkowej)

- Przekazuje się **wyłącznie na żądanie** w postępowaniu, czynnościach sprawdzających lub kontroli. Termin to co najmniej 3 dni, a za nieuzasadnioną odmowę grozi kara porządkowa. **Osobny plik dla każdego magazynu**, z jednolitym nazewnictwem w całym systemie.
- **JPK_MAG(1)** dotyczy danych do 31.12.2026. Obsługuje tylko metodę ilościowo-wartościową, z sekcjami PZ, WZ, RW i MM oraz sumami kontrolnymi.
- **JPK_MAG(2)** dotyczy danych za okresy od **1.01.2027** (broszura MF z grudnia 2025, konsultacje XI 2025). Zawiera:
  - element **Metoda**, czyli jedną z czterech metod z art. 17 ust. 2,
  - sekcje PZ, PW, WZ, RW, **MMWE i MMWY** (MM rozbite na wejście i wyjście),
  - nową sekcję **INW** (inwentaryzacja: data, czas od–do, tabela spisu i tabela weryfikacji),
  - pola **NrKSeFPZ i NrKSeFWZ**,
  - bez sekcji kontrolnych.
- **Pola przy metodzie ilościowo-wartościowej**, z obowiązkową wartością:

| Dokument | Nagłówek | Wiersze |
|---|---|---|
| PZ | NumerPZ, DataPZ, WartoscPZ, DataOtrzymaniaPZ, Dostawca, opcjonalnie NumerFaPZ, NrKSeFPZ, DataFaPZ | NrWiersza, opcjonalnie KodTowaru, NazwaTowaru, Ilosc, JednostkaMiary, CenaJedn, WartoscPozycji |
| WZ | NumerWZ, DataWZ, WartoscWZ, DataWydaniaWZ, OdbiorcaWZ, opcjonalnie dane faktury | jak w PZ |
| RW | NumerRW, DataRW, WartoscRW, DataWydaniaRW, opcjonalnie DokadRW | jak w PZ |
| MMWY / MMWE | Numer, Data, Wartosc, DataWydania / DataPrzyjecia, opcjonalnie Dokad / Skad | jak w PZ |
| INW | dane spisu | Lp, Indeks, Nazwa, Jednostka, Ilosc, Cena, Wartosc, Uwagi |

  Nagłówek pliku zawiera NIP, nazwę firmy, kod urzędu skarbowego, okres i walutę PLN. Sekcję INW wypełnia się, jeśli inwentaryzacja była udokumentowana w systemie komputerowym.
- **Wniosek: przy wybranej metodzie 1 WMS bez cen nie wygeneruje poprawnego JPK_MAG.** Pola wartości można pominąć wyłącznie przy metodzie ilościowej.

### 3.2 JPK_KR_PD i JPK_ST_KR (JPK_CIT, art. 9 ust. 1c CIT)

**Pierwszy rok obowiązku**, czyli rok podatkowy rozpoczynający się po podanej dacie:

| Data | Kogo dotyczy | Uwagi |
|---|---|---|
| 31.12.2024 | podatkowe grupy kapitałowe i podatnicy z przychodem powyżej 50 mln EUR | JPK_ST_KR za 2025 był fakultatywny (zwolnienie rozporządzeniem z 13.12.2024) |
| **31.12.2025** | pozostali podatnicy CIT składający **JPK_V7M** | prawdopodobnie Wasza spółka, czyli **pierwszy rok to 2026** |
| 31.12.2026 | pozostali, w tym składający JPK_V7K | |

**Terminy złożenia:**
- Rozporządzenie MFiG z 16.02.2026 (Dz.U. poz. 188) przesunęło termin do końca 7. miesiąca po roku. Za lata kończące się przed 31.12.2025 termin minął 31.07.2026.
- Od **1.07.2026** ustawa na stałe ustala termin **na koniec 7. miesiąca po zakończeniu roku**. Jeśli rok obrotowy pokrywa się z kalendarzowym, za 2026 trzeba złożyć **do 31.07.2027**.

**Rola WMS:**
- WMS nie generuje JPK_KR_PD. Dziennik, ZOiS i oznaczenia podatkowe (rozporządzenie MF z 16.08.2024, Dz.U. poz. 1314) pochodzą z FK.
- Każdy zapis w FK z WMS musi jednak wskazywać dowód (art. 23 ust. 2 pkt 2), a dowód zbiorczy musi wymieniać pojedyncze dowody (art. 20 ust. 3 pkt 1).
- JPK_ST_KR obejmuje: numer inwentarzowy, daty, numer OT, rodzaj dokumentu nabycia, nazwę, KŚT, metody i stawki amortyzacji podatkowej i bilansowej, wartości i wykreślenia. WMS powinien przechowywać numer inwentarzowy i numer OT dla pozycji będących środkami trwałymi, żeby dało się je powiązać z FK.

**Niepewne**: status VAT (V7M czy V7K) i przychód spółki trzeba potwierdzić, bo od nich zależy rok startu (2025, 2026 albo 2027). Harmonogram zmieniał się kilka razy (2024–2026), więc przed wdrożeniem warto sprawdzić aktualną stronę MF.

---

## 4. Integracja z Symfonią FK (scenariusz: WMS zastępuje magazyn Symfonii Handel)

Co miesięcznie powinno trafiać do FK:
1. **Zestawienie obrotów magazynowych** dla każdego magazynu i okresu: bilans otwarcia, przychody (PZ, PW, MMWE), rozchody (WZ, RW, MMWY), bilans zamknięcia, ilościowo i **wartościowo**, z podziałem na grupy kont (31 materiały, 33 towary itd.).
2. **Dowody zbiorcze dla dekretacji**, np. „RW zbiorcze 10/2026 – kawiarnia X – konto 401 / MPK X”, **z wykazem numerów dokumentów źródłowych**.
   - Księgowanie jedną kwotą miesięcznie jest dopuszczalne (art. 20 ust. 3 pkt 1), pod warunkiem że ślad do dokumentów zostaje zachowany.
   - Same zestawienie zbiorcze bez wykazu dokumentów **nie wystarczy**.
   - Alternatywa to eksport dokument po dokumencie (np. plik importu Symfonii FK).
3. **Uzgodnienie PZ z FV** (konto 30): lista PZ bez faktury i faktur bez PZ na koniec miesiąca.
4. **Korekty wartości** (różnice z korekt faktur rozliczone na stan i rozchód).
5. **Różnice inwentaryzacyjne wycenione FIFO**, z protokołem i decyzją o rozliczeniu (niedobór zawiniony lub niezawiniony, nadwyżka). Ujmuje się je w roku, którego dotyczy inwentaryzacja (art. 27 ust. 2).
6. **Kontrola zgodności**: stan magazynu w WMS według wyceny FIFO na koniec miesiąca ma być równy saldu kont 31 i 33 w FK. Raport różnic i blokada zamknięcia okresu, dopóki różnice nie są wyjaśnione.

Okresy:
- WMS musi zamykać miesiąc zgodnie z FK.
- Po zamknięciu nie wolno dodawać dokumentów z datą w tym okresie.
- Korekty wpisuje się do bieżącego okresu dokumentem korygującym (art. 25 ust. 2).
- Zestawienia obrotów i sald FK sporządza się co miesiąc, a roczne najpóźniej do 85. dnia po dniu bilansowym (art. 24 ust. 5 pkt 2), co wyznacza termin zamknięcia WMS.

Migracja z Symfonii:
- **Bilans otwarcia** przenosi się partiami FIFO z ceną i datą z Symfonii, na dzień przejścia, najlepiej 1.01, z protokołem uzgodnienia.
- Dane historyczne z Symfonii Handel trzeba przechowywać przez okresy z sekcji 1.7 razem z możliwością wygenerowania JPK_MAG za te lata. Licencja albo zrzut danych muszą to zapewnić.
- Wymaga to aktualizacji dokumentacji art. 10, w tym nowej daty rozpoczęcia eksploatacji.

---

## 5. Lista braków WMS (dziś bez cen) i model danych

### A. Wycena (bloker prawny przy metodzie 1)
- [ ] Tabela **cost_layers (partii FIFO)**: pozycja, magazyn, ilość początkowa i pozostała, cena jednostkowa netto PLN, dokument źródłowy (PZ lub MMWE), data przyjęcia, a przy MM wskaźnik na partię macierzystą.
- [ ] **Silnik FIFO**: każdy rozchód (WZ, RW, MMWY, niedobór) zdejmuje partie od najstarszej. Tabela **layer_consumption** (ruch, partia, ilość, wartość) przechowuje wynik wyceny w sposób trwały (art. 20 ust. 5 pkt 1). Wyceny nie wolno przeliczać „w locie” po fakcie.
- [ ] **MM**: MMWY i MMWE są powiązane, przenoszą wartość 1:1, a partie zachowują pierwotną datę i cenę.
- [ ] **Korekta wartości** jako osobny typ dokumentu, bez ilości. Działa na partię albo na rozchód zgodnie z polityką.
- [ ] **Koszty dodatkowe** (transport itd.): rozdział na pozycje PZ według wartości, wagi lub ilości, **albo** decyzja o cenie zakupu (art. 34 ust. 1 pkt 1).
- [ ] **Waluta**: kwota w walucie, kurs, data i źródło kursu, przeliczenie na PLN zapisane na stałe w dokumencie.
- [ ] Stała precyzja i reguła zaokrągleń (wiersz do 0,01 zł, różnice z zaokrągleń na ostatnim zdjęciu partii), opisana w dokumentacji art. 10.
- [ ] Polityka dla rozchodu przy braku stanu: **blokada stanów ujemnych**, bo inaczej FIFO nie ma czego wycenić.

### B. Dokumenty
- [ ] Typy dokumentów zgodne z JPK_MAG: **PZ, (PW), WZ, RW, MMWY/MMWE, INW**, korekty wartości i storna.
- [ ] **Serie numeracji** według typu, magazynu i roku, ciągłe i bez luk, nadawane przy zatwierdzeniu, nie przy tworzeniu wersji roboczej. Anulowanie odbywa się przez storno, nigdy przez usunięcie.
- [ ] **PZ**: dostawca (nazwa, NIP, adres), numer i data FV (lub specyfikacji), opcjonalnie numer KSeF, data otrzymania, cena i wartość netto, magazyn i przyjmujący.
- [ ] **RW**: miejsce przeznaczenia lub MPK (kawiarnia), cel (zużycie, oddanie do używania), klasa (koszt, OT, wyposażenie pozabilansowe).
- [ ] **Wydruk lub PDF każdego dowodu** z elementami art. 21 ust. 1 i oznaczeniem z art. 13 ust. 4 (nazwa jednostki, nazwa programu i wersja, data wydruku). Wydruk dla odbiorcy może być bez wartości (art. 21 ust. 2), ale wersja z wartościami musi dać się wygenerować.
- [ ] Podpis wystawcy i odbierającego przy MM, WZ i RW (art. 21 ust. 1 pkt 5 i ust. 4), zapisany przy dokumencie razem ze znacznikiem czasu.

### C. Okresy, korekty, ślad zmian
- [ ] **Zamykanie miesięcy i lat** z blokadą zapisów z datą w zamkniętym okresie. Otwarcie okresu wymaga osobnego uprawnienia i jest logowane.
- [ ] Storno według jednej konwencji uzgodnionej z FK, z powiązaniem storno ↔ dokument pierwotny.
- [ ] **Dziennik zdarzeń** tylko do dopisywania: kto, kiedy, co, adres IP lub urządzenie. Najlepiej z kontrolą integralności (łańcuch skrótów), żeby wykazać „niezmienność” wymaganą w art. 20 ust. 5 pkt 4 i art. 23 ust. 1.
- [ ] Role i rozdział obowiązków (wystawia, zatwierdza, zamyka okres), co jest zasadą ochrony danych z art. 10 ust. 1 pkt 3 lit. c.

### D. Raporty i eksporty
- [ ] **Wycena stanu według magazynu, na dowolną datę** (z partiami), z możliwością ustalenia stanu wstecz (art. 24 ust. 4 pkt 4).
- [ ] **Zestawienie obrotów (BO, przychody, rozchody, BZ)** według magazynu, grupy i konta, z numerowanymi stronami i sumami narastającymi (art. 13 ust. 5).
- [ ] Kartoteka pozycji z ilościami i wartościami.
- [ ] **Eksport do FK** (zbiorczo z wykazem dowodów albo dokument po dokumencie) z mapowaniem typ dokumentu → konto Wn/Ma → MPK.
- [ ] Raport uzgodnienia z kontami 3xx i 30.
- [ ] **JPK_MAG(1)** za okresy do 2026 i **JPK_MAG(2)** od 2027, osobno dla każdego magazynu, walidowane schematem XSD MF.
- [ ] Roczny trwały zrzut ksiąg magazynowych (PDF/A albo CSV z sumą kontrolną) jako odpowiednik wydruku (art. 13 ust. 6).
- [ ] Raport wiekowania partii FIFO dla odpisów aktualizujących (art. 28 ust. 1 pkt 6, art. 34 ust. 5).

### E. Inwentaryzacja
- [ ] Zarządzenie i komisja, arkusze spisowe z numeracją, zamrożenie stanu na datę spisu, doliczanie i odliczanie ruchów przy spisie w okresie od 3 miesięcy przed do 15 dni po dniu bilansowym.
- [ ] Wycena różnic FIFO, protokół z podpisami, decyzja kierownika, dokument korygujący przypięty do roku inwentaryzacji.
- [ ] Spis składników obcych (leasing, palarnia).
- [ ] Dane do sekcji INW w JPK_MAG(2).

### F. Klasyfikacja składników
- [ ] Atrybut **klasy bilansowej** na pozycji lub partii: zapas (31 lub 33), środek trwały (numer inwentarzowy, KŚT, numer OT z FK), wyposażenie pozabilansowe.
- [ ] Rozdzielenie MM (zapas zostaje zapasem) od RW lub OT (oddanie do używania). Później tylko **ewidencja pozabilansowa lokalizacji**: kto, gdzie, odpowiedzialny. Bez wartości bilansowej, poza JPK_MAG.
- [ ] Przy środkach trwałych: spis co rok, a na terenie strzeżonym co 4 lata.

### G. Dokumentacja i ochrona (art. 10, 71)
- [ ] Dokument „Opis systemu informatycznego warehouse-wms”: wykaz modułów, schemat bazy, algorytmy (FIFO, rozdział kosztów, zaokrąglenia, korekty), uprawnienia, kopie zapasowe, **wersja i data rozpoczęcia eksploatacji**, rejestr zmian. Zatwierdza kierownik jednostki na piśmie.
- [ ] Kopie zapasowe: automatyczne, szyfrowane, poza lokalizacją podstawową, z okresowym **testem odtworzenia** i retencją co najmniej 6 lat dla zamkniętych lat. Retencja danych księgowych blokuje jakiekolwiek usuwanie.

---

## 6. RODO, podpis na tablecie, ślad zmian

- **Podpis palcem na tablecie** to w sensie eIDAS (art. 25 rozporządzenia 910/2014) zwykły podpis elektroniczny, a nie kwalifikowany. Nie można odmówić mu skutków prawnych tylko dlatego, że jest elektroniczny, i jest dowodem w postępowaniu.
  - Nie spełnia formy elektronicznej z art. 78¹ KC, ale dowody magazynowe nie wymagają formy szczególnej.
  - Czy taki podpis spełnia wymóg „podpisu” z art. 21 ust. 1 pkt 5 i ust. 4 UoR przy przekazaniu składnika, **ustawa nie rozstrzyga**. Ten punkt jest niepewny i trzeba go potwierdzić z księgową lub biegłym.
  - Siłę dowodową wzmacniają: imienny login odbierającego albo PIN, znacznik czasu, powiązanie podpisu ze skrótem treści dokumentu i blokada edycji po podpisaniu.
- **RODO**:
  - podstawą przetwarzania danych pracowników i kierowców jest art. 6 ust. 1 lit. c i f,
  - **dane dynamiki podpisu (biometria) mogą być danymi szczególnej kategorii (art. 9)**, jeśli służą jednoznacznej identyfikacji; bezpieczniej zapisywać tylko obraz podpisu,
  - potrzebne są: obowiązek informacyjny, wpis w rejestrze czynności przetwarzania, umowa powierzenia z hostingiem, minimalizacja danych,
  - okres retencji jest powiązany z okresem dla dowodów księgowych (5–6 lat).

---

## 7. Do ustalenia z główną księgową / biegłym (nie jest to porada prawna)

1. Którą metodę z art. 17 ust. 2 przyjmujemy dla której grupy (towary, materiały, części)? Czy dla drobnicy i dekoracji wystarczy metoda 4 albo metoda ilościowa?
2. Czy wyceniamy w **cenie nabycia** (z transportem), czy w **cenie zakupu** (art. 34 ust. 1 pkt 1)? Jeśli w cenie nabycia, jak rozdzielamy koszty dodatkowe?
3. Czy FIFO liczymy na poziomie pozycji i magazynu, czy całej spółki? Czy dla drogiego sprzętu z numerem seryjnym stosujemy identyfikację szczegółową?
4. Jak rozliczamy korekty faktur zakupu po rozchodzie partii? Jaki jest próg istotności?
5. Jaki kurs walut stosujemy (ten sam co w FK)?
6. Jaki jest próg środków trwałych i niskocennych w polityce (np. 10 000 zł)? Czy prowadzimy ewidencję pozabilansową wyposażenia i czy ją spisujemy?
7. **Kiedy przedmiot przestaje być zapasem**: przy wydaniu do kawiarni (RW lub OT) czy przy faktycznym oddaniu do używania? Czy magazynki w kawiarniach to osobne magazyny księgowe?
8. Czy magazyn centralny to „strzeżone składowisko” (spis co 2 lata) albo „teren strzeżony” dla środków trwałych (co 4 lata)?
9. Konwencja storna (czerwone czy czarne) i sposób przekazywania danych do Symfonii FK (zbiorczo z wykazem dowodów czy dokument po dokumencie). Jakie konta i MPK?
10. Czy podpis na tablecie, z naszymi zabezpieczeniami, uznajemy za podpis z art. 21 ust. 1 pkt 5? Kto zatwierdza dokumentację art. 10?
11. Status VAT (V7M czy V7K) i przychód, czyli od którego roku JPK_KR_PD i JPK_ST_KR obowiązują spółkę i kto w FK za nie odpowiada.
12. Data przejścia i protokół bilansu otwarcia partii z Symfonii. Jak zachowujemy dostęp do historycznych danych Symfonii Handel (JPK_MAG za lata ubiegłe)?
13. Czy biegły rewident (jeśli spółka podlega badaniu) chce zobaczyć dokumentację i testy systemu przed startem?

---

## 8. Źródła

**Ustawa o rachunkowości** (tekst jednolity Dz.U. 2026 poz. 522):
- tekst jednolity: https://dziennikustaw.gov.pl/DU/2026/522 oraz https://eli.gov.pl/api/acts/DU/2026/522/text/O/D20260522.pdf
- ISAP: https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19941210591
- informacja PIBR o nowym tekście jednolitym: https://www.pibr.org.pl/pl/aktualnosci/2661,Nowy-tekst-jednolity-ustawy-o-rachunkowosci
- poszczególne artykuły w tekście ujednoliconym (prostowprawo.pl, stan na 16.10.2026): art. 10, 13, 17, 20, 21, 22, 23, 24, 25, 26, 27, 28, 32, 34, 71, 74, pod adresem https://prostowprawo.pl/ustawa-o-rachunkowosci/art-NN

**CIT i środki trwałe:**
- CIT art. 16d: https://prostowprawo.pl/ustawa-o-cit/art-16d
- ISAP CIT: https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19920210086
- interpretacja 0111-KDIB2-1.4010.106.2026.1.AJ (niskocenne a JPK_ST_KR): https://taxmachine.pl/interpretacje/0111-kdib2-1-4010-106-2026-1-aj
- GOFIN, „Wyposażenie w księgach rachunkowych” (KSR 11, ewidencja pozabilansowa): https://gofin.pl/rachunkowosc/17,2,85,231627,wyposazenie-w-ksiegach-rachunkowych.html
- KIP, inwentaryzacja niskocennych: https://izbapodatkowa.pl/baza-wiedzy/inwentaryzacja-niskocennych-skladnikow-majatku/

**JPK_MAG:**
- broszura JPK_MAG(2), MF, XII 2025: https://www.gov.pl/attachment/b33d79c1-ce9b-41f6-beb9-cf99396ef80e
- lista zmian JPK_MAG(1) → (2): https://www.gov.pl/attachment/f08fdb4d-8b95-44d0-a5f7-b60174beac7a
- konsultacje JPK_MAG(2): https://www.gov.pl/web/finanse/konsultacje-dotyczace-struktury-logicznej-jpkmag2

**JPK w podatkach dochodowych:**
- MF/KAS, harmonogram JPK_KR_PD i JPK_ST_KR: https://www.gov.pl/web/kas/struktury-jpk-w-podatkach-dochodowych
- pytania i odpowiedzi JPK_PD (zmiana 28.10.2025): https://podatki.gov.pl/podatki-firmowe/jednolity-plik-kontrolny/jpk_pd/pytania-i-odpowiedzi-jpk_pd
- broszura JPK_KR_PD, aktualna od 1.07.2026: https://www.podatki.gov.pl/media/umahd4he/aktualizacja-broszury-jpk_kr_pd-1-aktualna-od-01072026r.pdf
- broszura JPK_ST_KR, aktualna od 1.07.2026: https://www.podatki.gov.pl/media/orqlj0t0/aktualizacja-broszury-jpk_st_kr-1-aktualna-od-01072026r.pdf
- broszura JPK_ST_KR z 26.08.2024: https://www.podatki.gov.pl/media/a42pfyzs/broszura_informacyjna-dotycz%C4%85ca-struktury-jpk_st_kr-1-26082024.pdf
- Deloitte o przedłużeniu terminu JPK_CIT: https://www.deloitte.com/pl/pl/services/tax/perspectives/alerty-podatkowe/jpk-cit-przedluzenie-terminu-przesylania-ksiag-rachunkowych.html
- INFORLEX o stałym terminie 7 miesięcy od 1.07.2026: https://www.inforlex.pl/czasopisma/I78/2026/7/tresc,FOB0000000000007606536,Termin-przesylania-JPK-ksiag-rachunkowych-wydluzony-na-stale-do-siedmiu-miesiecy.html

**Ordynacja podatkowa** (art. 193a, art. 70, art. 86): https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19971370926

**KSeF** (tylko dla kontekstu, poza zakresem): https://ksef.podatki.gov.pl/informacje-ogolne-ksef-20/zakres-obowiazkowego-ksef/

**Elementy niepotwierdzone**, oparte na wiedzy ogólnej i do sprawdzenia:
- dokładna treść art. 30 ust. 2 UoR (kursy walut),
- interpretacja „podpisu” z art. 21 przy podpisie na tablecie,
- czy dane podpisu dynamicznego są biometrią w rozumieniu RODO,
- przypisanie spółki do grupy V7M lub V7K w JPK_CIT.
