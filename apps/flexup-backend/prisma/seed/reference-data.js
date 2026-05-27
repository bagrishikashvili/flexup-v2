"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const SECTIONS = [
    { slug: 'hospitality', name: 'Hospitality', nameKa: 'სასტუმრო-რესტორნები', sortOrder: 1 },
    { slug: 'retail', name: 'Retail', nameKa: 'საცალო ვაჭრობა', sortOrder: 2 },
    { slug: 'logistics', name: 'Logistics', nameKa: 'ლოგისტიკა', sortOrder: 3 },
    { slug: 'cleaning', name: 'Cleaning', nameKa: 'დასუფთავება', sortOrder: 4 },
    { slug: 'events', name: 'Events', nameKa: 'ღონისძიებები', sortOrder: 5 },
    { slug: 'delivery', name: 'Delivery', nameKa: 'მიწოდება', sortOrder: 6 },
    { slug: 'other', name: 'Other', nameKa: 'სხვა', sortOrder: 99 },
];
const CATEGORIES = [
    { sectionSlug: 'hospitality', slug: 'barista-junior', title: 'Barista - Junior', titleKa: 'ბარისტა - ჯუნიორი', isExperienceRequired: false, isTippable: true, minimumEarningsPerHourMinor: 1500 },
    { sectionSlug: 'hospitality', slug: 'barista-senior', title: 'Barista - Senior', titleKa: 'ბარისტა - სენიორი', isExperienceRequired: true, isTippable: true, minimumEarningsPerHourMinor: 2000 },
    { sectionSlug: 'hospitality', slug: 'bartender', title: 'Bartender', titleKa: 'ბარმენი', isExperienceRequired: true, isTippable: true, minimumEarningsPerHourMinor: 2500 },
    { sectionSlug: 'hospitality', slug: 'waiter', title: 'Waiter / Waitress', titleKa: 'მიმტანი', isExperienceRequired: false, isTippable: true, minimumEarningsPerHourMinor: 1500 },
    { sectionSlug: 'hospitality', slug: 'host-hostess', title: 'Host / Hostess', titleKa: 'ჰოსტი', isExperienceRequired: false, isTippable: true, minimumEarningsPerHourMinor: 1500 },
    { sectionSlug: 'hospitality', slug: 'kitchen-porter', title: 'Kitchen Porter', titleKa: 'სამზარეულოს თანაშემწე', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1500 },
    { sectionSlug: 'hospitality', slug: 'commis-chef', title: 'Commis Chef', titleKa: 'მზარეული - ჯუნიორი', isExperienceRequired: true, isTippable: false, minimumEarningsPerHourMinor: 2000 },
    { sectionSlug: 'hospitality', slug: 'chef-de-partie', title: 'Chef de Partie', titleKa: 'მზარეული - სენიორი', isExperienceRequired: true, isTippable: false, minimumEarningsPerHourMinor: 2800 },
    { sectionSlug: 'hospitality', slug: 'sous-chef', title: 'Sous Chef', titleKa: 'სუ-შეფი', isExperienceRequired: true, isTippable: false, minimumEarningsPerHourMinor: 3500 },
    { sectionSlug: 'hospitality', slug: 'assistant-manager', title: 'Assistant Manager', titleKa: 'მენეჯერის თანაშემწე', isExperienceRequired: true, isTippable: false, minimumEarningsPerHourMinor: 2500 },
    { sectionSlug: 'retail', slug: 'sales-assistant', title: 'Sales Assistant', titleKa: 'გაყიდვების კონსულტანტი', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1500 },
    { sectionSlug: 'retail', slug: 'cashier', title: 'Cashier', titleKa: 'მოლარე', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1500 },
    { sectionSlug: 'retail', slug: 'stock-assistant', title: 'Stock Assistant', titleKa: 'მარაგების მენეჯერი', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1500 },
    { sectionSlug: 'logistics', slug: 'warehouse-worker', title: 'Warehouse Worker', titleKa: 'საწყობის თანამშრომელი', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1600 },
    { sectionSlug: 'logistics', slug: 'forklift-operator', title: 'Forklift Operator', titleKa: 'ფორკლიფტის ოპერატორი', isExperienceRequired: true, isTippable: false, minimumEarningsPerHourMinor: 2200 },
    { sectionSlug: 'logistics', slug: 'order-picker', title: 'Order Picker', titleKa: 'შეკვეთის შემგროვებელი', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1500 },
    { sectionSlug: 'cleaning', slug: 'cleaning', title: 'Cleaning', titleKa: 'დასუფთავება', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1300 },
    { sectionSlug: 'cleaning', slug: 'housekeeping', title: 'Housekeeping', titleKa: 'სასტუმროს დასუფთავება', isExperienceRequired: false, isTippable: true, minimumEarningsPerHourMinor: 1400 },
    { sectionSlug: 'events', slug: 'event-staff', title: 'Event Staff', titleKa: 'ღონისძიების თანამშრომელი', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1500 },
    { sectionSlug: 'events', slug: 'event-host', title: 'Event Host', titleKa: 'ღონისძიების წამყვანი', isExperienceRequired: true, isTippable: false, minimumEarningsPerHourMinor: 2500 },
    { sectionSlug: 'events', slug: 'promoter', title: 'Promoter', titleKa: 'პრომოუტერი', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1500 },
    { sectionSlug: 'delivery', slug: 'food-delivery', title: 'Food Delivery', titleKa: 'საკვების მიწოდება', isExperienceRequired: false, isTippable: true, minimumEarningsPerHourMinor: 1500 },
    { sectionSlug: 'other', slug: 'other', title: 'Other', titleKa: 'სხვა', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1300 },
];
const SKILLS = [
    { slug: '1-year-experience', name: '>1 year experience', nameKa: '1+ წლის გამოცდილება', sortOrder: 1 },
    { slug: '2-years-experience', name: '>2 years experience', nameKa: '2+ წლის გამოცდილება', sortOrder: 2 },
    { slug: 'registrations', name: 'Registrations', nameKa: 'რეგისტრაცია', sortOrder: 10 },
    { slug: 'taking-reservations', name: 'Taking reservations', nameKa: 'ჯავშნის მიღება', sortOrder: 11 },
    { slug: 'strong-communication', name: 'Strong communication skills', nameKa: 'ძლიერი კომუნიკაცია', sortOrder: 12 },
    { slug: 'customer-service', name: 'Customer Service', nameKa: 'მომხმარებელთა მომსახურება', sortOrder: 13 },
    { slug: 'latte-art', name: 'Latte Art', nameKa: 'ლატე ხელოვნება', sortOrder: 14 },
    { slug: 'milk-steaming', name: 'Milk steaming skills', nameKa: 'რძის ორთქლვა', sortOrder: 15 },
    { slug: 'answering-emails', name: 'Answering e-mails', nameKa: 'ემეილების მართვა', sortOrder: 16 },
    { slug: 'booking-system', name: 'Working with booking system', nameKa: 'ჯავშნის სისტემასთან მუშაობა', sortOrder: 17 },
    { slug: 'check-in-guests', name: 'Check-in guests', nameKa: 'სტუმრების მიღება', sortOrder: 18 },
    { slug: 'check-out-guests', name: 'Check-out guests', nameKa: 'სტუმრების გასვლის გაფორმება', sortOrder: 19 },
    { slug: 'first-aid', name: 'First Aid Qualified', nameKa: 'პირველადი დახმარების სერტიფიკატი', sortOrder: 20 },
    { slug: 'team-leadership', name: 'Team Leadership Experience', nameKa: 'გუნდის ლიდერობის გამოცდილება', sortOrder: 21 },
    { slug: 'cooking-experience', name: 'Cooking experience', nameKa: 'სამზარეულოს გამოცდილება', sortOrder: 22 },
    { slug: 'food-handling', name: 'Food handling certificate', nameKa: 'საკვებთან მუშაობის სერტიფიკატი', sortOrder: 23 },
    { slug: 'cash-handling', name: 'Cash handling', nameKa: 'ნაღდი ფულის მართვა', sortOrder: 24 },
    { slug: 'pos-system', name: 'POS system experience', nameKa: 'POS სისტემის გამოცდილება', sortOrder: 25 },
];
const APPEARANCES = [
    { slug: 'trimmed-beard', name: 'Trimmed beard', nameKa: 'მოვლილი წვერი', sortOrder: 1 },
    { slug: 'clean-shaven', name: 'Clean-shaven', nameKa: 'გაპარსული', sortOrder: 2 },
    { slug: 'no-visible-tattoos', name: 'No visible tattoos', nameKa: 'არ ჩანდეს ტატუ', sortOrder: 3 },
    { slug: 'no-visible-piercings', name: 'No visible piercings', nameKa: 'არ ჩანდეს პირსინგი', sortOrder: 4 },
    { slug: 'no-striking-jewellery', name: 'No striking jewellery', nameKa: 'არ იყოს მკვეთრი ბიჟუტერია', sortOrder: 5 },
    { slug: 'no-nail-polish', name: 'No nail polish / fake nails', nameKa: 'უფრჩხილო ფერი ან ხელოვნური ფრჩხილები', sortOrder: 6 },
    { slug: 'plain-white-tshirt', name: 'Plain white t-shirt', nameKa: 'მარტივი თეთრი მაისური', sortOrder: 10 },
    { slug: 'plain-black-tshirt', name: 'Plain black t-shirt', nameKa: 'მარტივი შავი მაისური', sortOrder: 11 },
    { slug: 'white-dress-shirt', name: 'White dress shirt', nameKa: 'თეთრი პერანგი', sortOrder: 12 },
    { slug: 'black-dress-shirt', name: 'Black dress shirt', nameKa: 'შავი პერანგი', sortOrder: 13 },
    { slug: 'black-smart-trousers', name: 'Black smart trousers', nameKa: 'შავი ოფიციალური შარვალი', sortOrder: 14 },
    { slug: 'smart-trousers', name: 'Smart trousers', nameKa: 'ოფიციალური შარვალი', sortOrder: 15 },
    { slug: 'black-jeans', name: 'Black jeans', nameKa: 'შავი ჯინსი', sortOrder: 16 },
    { slug: 'suit', name: 'Suit', nameKa: 'კოსტუმი', sortOrder: 17 },
    { slug: 'blazer', name: 'Blazer', nameKa: 'პიჯაკი', sortOrder: 18 },
    { slug: 'uniform-on-site', name: 'Uniform provided on site', nameKa: 'უნიფორმა ადგილზე გადაეცემა', sortOrder: 20 },
];
const LANGUAGES = [
    { slug: 'english-speaking', name: 'English speaking skills', nameKa: 'ინგლისურის სალაპარაკო ცოდნა', sortOrder: 1 },
    { slug: 'english-written', name: 'Written English skills', nameKa: 'ინგლისურის წერითი ცოდნა', sortOrder: 2 },
    { slug: 'russian-speaking', name: 'Russian speaking skills', nameKa: 'რუსულის სალაპარაკო ცოდნა', sortOrder: 3 },
    { slug: 'russian-written', name: 'Written Russian skills', nameKa: 'რუსულის წერითი ცოდნა', sortOrder: 4 },
    { slug: 'georgian-speaking', name: 'Georgian speaking skills', nameKa: 'ქართულის სალაპარაკო ცოდნა', sortOrder: 5 },
    { slug: 'georgian-written', name: 'Written Georgian skills', nameKa: 'ქართულის წერითი ცოდნა', sortOrder: 6 },
];
async function seedReferenceData() {
    console.log('Seeding reference data...');
    const sectionMap = {};
    for (const section of SECTIONS) {
        const created = await prisma.jobSection.upsert({
            where: { slug: section.slug },
            create: section,
            update: section,
        });
        sectionMap[section.slug] = created.id;
    }
    console.log(`  ✓ ${SECTIONS.length} sections`);
    for (const cat of CATEGORIES) {
        const { sectionSlug, ...rest } = cat;
        await prisma.jobCategory.upsert({
            where: { slug: cat.slug },
            create: { ...rest, sectionId: sectionMap[sectionSlug] },
            update: { ...rest, sectionId: sectionMap[sectionSlug] },
        });
    }
    console.log(`  ✓ ${CATEGORIES.length} categories`);
    for (const skill of SKILLS) {
        await prisma.skill.upsert({ where: { slug: skill.slug }, create: skill, update: skill });
    }
    console.log(`  ✓ ${SKILLS.length} skills`);
    for (const app of APPEARANCES) {
        await prisma.appearance.upsert({ where: { slug: app.slug }, create: app, update: app });
    }
    console.log(`  ✓ ${APPEARANCES.length} appearances`);
    for (const lang of LANGUAGES) {
        await prisma.language.upsert({ where: { slug: lang.slug }, create: lang, update: lang });
    }
    console.log(`  ✓ ${LANGUAGES.length} languages`);
    console.log('✅ Reference data seeded');
}
seedReferenceData()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=reference-data.js.map