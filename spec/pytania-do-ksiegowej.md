# Pytania do Głównej Księgowej: zasady ewidencji magazynowej w nowym systemie

Szanowna Pani,

budujemy własny system magazynowy, który ma zastąpić część magazynową programu Symfonia Handel. Księgowość, czyli Symfonia FK, zostaje bez zmian. Nowy system będzie rejestrował:

- przyjęcia do magazynu na podstawie faktur zakupowych (PZ),
- przesunięcia między magazynem centralnym a kawiarniami (MM),
- wydania i zużycie (RW, WZ),
- zwroty,
- inwentaryzacje.

Zanim zaczniemy budować wycenę magazynu, potrzebujemy decyzji w sprawie zasad rachunkowości, aby system był zgodny z polityką rachunkowości spółki i z danymi w Symfonii FK. Poniżej zebraliśmy pytania. Przy części z nich podaliśmy możliwe warianty, ale chętnie przyjmiemy też inne rozwiązanie.

Dziękujemy za pomoc. Jeśli wygodniej będzie omówić to na krótkim spotkaniu, chętnie się dostosujemy.

---

## A. Metoda ewidencji i wycena

**1.** Jaką metodę ewidencji zapasów stosujemy (art. 17 ust. 2 ustawy o rachunkowości)? Czy ta sama metoda dotyczy wszystkich grup asortymentu?
Warianty: ilościowo-wartościowa / tylko ilościowa z wyceną na koniec roku / odpis w koszty w dniu zakupu z korektą na dzień bilansowy / różnie dla różnych grup.

Odpowiedź: ______________________________________________

**2.** Czy zapasy wyceniamy w cenie zakupu (sama kwota z faktury netto), czy w cenie nabycia (z doliczeniem transportu i innych kosztów zakupu)?
Warianty: cena zakupu / cena nabycia.

Odpowiedź: ______________________________________________

**3.** Jeśli w cenie nabycia: jak rozdzielać koszty transportu z osobnej faktury na poszczególne pozycje dostawy?
Warianty: proporcjonalnie do wartości / do ilości / do wagi / inaczej.

Odpowiedź: ______________________________________________

**4.** Jak traktować rabaty i opusty, które dostajemy po zakupie (np. rabat roczny)? Czy obniżają wartość zapasu, czy wpływają bezpośrednio na wynik?

Odpowiedź: ______________________________________________

**5.** Jak rozliczać korektę faktury zakupu (zmianę ceny), jeśli towar z tej dostawy został już częściowo lub w całości wydany?
Warianty: proporcjonalnie na stan i wydania / w całości w koszty bieżącego okresu / poniżej określonej kwoty w koszty, powyżej proporcjonalnie (jaki próg?).

Odpowiedź: ______________________________________________

**6.** Jaki kurs walut stosować przy fakturach w walucie obcej, tak aby był zgodny z Symfonią FK?
Warianty: średni kurs NBP z dnia poprzedzającego / inny.

Odpowiedź: ______________________________________________

## B. FIFO i magazyny

**7.** Czy potwierdza Pani wycenę rozchodów metodą FIFO („pierwsze weszło, pierwsze wyszło”)? Czy dla drogiego sprzętu z numerem seryjnym (np. ekspresy, lodówki) wolelibyśmy wyceniać każdą sztukę po jej własnej cenie zakupu?
Warianty: FIFO dla wszystkiego / FIFO plus identyfikacja szczegółowa dla wybranych pozycji / średnia ważona.

Odpowiedź: ______________________________________________

**8.** Czy FIFO ma być liczone osobno dla każdego magazynu (przesunięcie przenosi do kawiarni cenę pierwotnego zakupu), czy wspólnie dla całej spółki?
Warianty: osobno dla każdego magazynu / wspólnie.

Odpowiedź: ______________________________________________

**9.** Czy kawiarnie mają być w księgach osobnymi magazynami (towar w kawiarni nadal jest zapasem), czy wydanie do kawiarni oznacza rozchód w koszty?
Warianty: każda kawiarnia to osobny magazyn / wydanie do kawiarni to zawsze koszt / zależnie od rodzaju towaru.

Odpowiedź: ______________________________________________

**10.** Jakie konta i podział (np. miejsca powstawania kosztów) mamy stosować dla poszczególnych magazynów i kawiarni?

Odpowiedź: ______________________________________________

## C. Środki trwałe, wyposażenie i moment, w którym towar przestaje być zapasem

**11.** Jaki próg wartości stosujemy w polityce rachunkowości dla środków trwałych i dla wyposażenia niskocennego?
Warianty: do 10 000 zł jednorazowo w koszty / inny próg (jaki?).

Odpowiedź: ______________________________________________

**12.** Kiedy przedmiot kupiony do kawiarni (np. lodówka, lampa, meble) przestaje być zapasem w magazynie?
Warianty: od razu przy zakupie (środek trwały lub koszt) / przy wydaniu z magazynu do kawiarni / przy faktycznym oddaniu do używania.

Odpowiedź: ______________________________________________

**13.** Czy dla wyposażenia spisanego w koszty mamy prowadzić osobną ewidencję pozabilansową (co, gdzie się znajduje, kto odpowiada)? Czy ma ona obejmować spisy?
Warianty: tak, z corocznym spisem / tak, bez obowiązkowego spisu / nie.

Odpowiedź: ______________________________________________

**14.** Jak ewidencjonować zwrot do magazynu używanego przedmiotu, który wcześniej spisano w koszty?
Warianty: tylko ewidencja pozabilansowa, bez wartości / przyjęcie z wyceną (jaką?).

Odpowiedź: ______________________________________________

**15.** Dla środków trwałych: czy w naszym systemie mamy przechowywać numer inwentarzowy i numer dokumentu OT z Symfonii, aby powiązać obie ewidencje?

Odpowiedź: ______________________________________________

## D. Dokumenty, korekty i współpraca z Symfonią FK

**16.** Czy obecne rodzaje dokumentów i ich numeracja (PZ, WZ, RW, MM) mają zostać zachowane? Czy numeracja ma być osobna dla każdego magazynu i roku?

Odpowiedź: ______________________________________________

**17.** Błędy poprawiamy wyłącznie dokumentem korygującym, nigdy przez edycję. Którą konwencję stosuje FK?
Warianty: zapis ujemny (storno czerwone) / zapis odwrotny dodatni (storno czarne).

Odpowiedź: ______________________________________________

**18.** W jakiej formie przekazywać dane do Symfonii FK?
Warianty: jedno zestawienie miesięcznie z listą dokumentów / każdy dokument osobno (import) / inaczej.

Odpowiedź: ______________________________________________

**19.** Jak obsługujemy sytuacje, gdy towar przyszedł przed fakturą albo faktura przed towarem? Czy przyjęcie bez faktury ma być wyceniane wstępnie (np. według zamówienia)?

Odpowiedź: ______________________________________________

**20.** Do którego dnia miesiąca mamy zamykać okres w systemie magazynowym? Czy po zamknięciu wszystkie korekty wpisujemy z datą bieżącego miesiąca?

Odpowiedź: ______________________________________________

**21.** Jakie zestawienia chciałaby Pani dostawać co miesiąc do uzgodnienia ksiąg (np. obroty i stany wartościowo dla każdego magazynu, porównanie z saldem kont magazynowych)?

Odpowiedź: ______________________________________________

## E. Inwentaryzacja

**22.** Jak często i w jakim terminie mamy prowadzić spisy w magazynie centralnym i w kawiarniach? Czy magazyn centralny uznajemy za strzeżony (spis raz na 2 lata dla zapasów, raz na 4 lata dla środków trwałych)?

Odpowiedź: ______________________________________________

**23.** Jak wyceniać różnice inwentaryzacyjne? Niedobór według ceny najstarszej dostawy (FIFO), a nadwyżkę według jakiej ceny?

Odpowiedź: ______________________________________________

**24.** Czy dopuszczamy kompensatę niedoborów i nadwyżek przy zamiennikach? Kto zatwierdza rozliczenie różnic?

Odpowiedź: ______________________________________________

**25.** Kto wchodzi w skład komisji inwentaryzacyjnej i kto podpisuje protokół? Czy wystarczy protokół wygenerowany i podpisany w systemie?

Odpowiedź: ______________________________________________

**26.** Czy w naszych lokalizacjach są przedmioty należące do innych firm (np. ekspresy wypożyczone lub w leasingu), które mamy ujmować w spisie osobno?

Odpowiedź: ______________________________________________

## F. Podpis elektroniczny i dokumentacja systemu

**27.** Czy podpis złożony palcem na tablecie (z imiennym logowaniem, datą i godziną oraz blokadą zmian po podpisaniu) uznajemy za wystarczające potwierdzenie wydania lub przyjęcia towaru?
Warianty: tak / tak, ale z dodatkowym wydrukiem / nie, potrzebny podpis na papierze.

Odpowiedź: ______________________________________________

**28.** Ustawa wymaga opisu systemu komputerowego w dokumentacji zasad rachunkowości. Kto przygotowuje i zatwierdza ten opis? Czy ma Pani wzór, którego mamy się trzymać?

Odpowiedź: ______________________________________________

**29.** Jak długo mamy przechowywać dane i dokumenty w systemie?
Warianty: 5 lat / 6 lat / do przedawnienia podatkowego / dłużej.

Odpowiedź: ______________________________________________

**30.** Czy spółka podlega badaniu przez biegłego rewidenta? Jeśli tak, czy biegły powinien przejrzeć system przed uruchomieniem?

Odpowiedź: ______________________________________________

## G. Pliki JPK

**31.** Od którego roku spółka ma obowiązek wysyłania ksiąg w formie JPK (JPK_KR_PD oraz JPK_ST_KR dla środków trwałych)? Czy składamy JPK_VAT miesięcznie czy kwartalnie?

Odpowiedź: ______________________________________________

**32.** Kto będzie przygotowywał plik JPK_MAG na żądanie urzędu? Czy wystarczy, że system magazynowy wygeneruje go dla każdego magazynu osobno?

Odpowiedź: ______________________________________________

## H. Przejście z Symfonii Handel

**33.** Od jakiej daty chcemy przejść na nowy system?
Warianty: od początku roku obrotowego / od początku wybranego miesiąca.

Odpowiedź: ______________________________________________

**34.** Czy stany początkowe mamy przenieść z Symfonii z podziałem na poszczególne dostawy (data i cena zakupu), czy wystarczy jedna wartość na pozycję? Kto podpisuje protokół uzgodnienia stanów?

Odpowiedź: ______________________________________________

**35.** Jak zapewnimy dostęp do danych magazynowych z Symfonii Handel za poprzednie lata (np. na potrzeby kontroli lub JPK_MAG)?
Warianty: utrzymanie licencji w trybie tylko do odczytu / archiwalny eksport danych / inaczej.

Odpowiedź: ______________________________________________

---

Z góry dziękujemy za odpowiedzi. Na ich podstawie przygotujemy zasady wyceny w systemie i przedstawimy je Pani do akceptacji przed uruchomieniem.
