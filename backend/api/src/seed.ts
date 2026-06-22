import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BusinessesService } from './businesses/businesses.service';

// ── Inline minimal Business data (full list lives in mobile store) ──────
// These are enough real Addis Ababa businesses to make the app useful.
const SEED_BUSINESSES = [
  // Restaurants
  { id: 'food-1', name: 'Yod Abyssinia Restaurant', category: 'Ethiopian Cuisine', categoryId: 'food', rating: 4.8, reviews: 324, latitude: 9.0227, longitude: 38.7468, image: 'https://images.unsplash.com/photo-1517521271057-7b1570fcff78?w=400', verified: true, description: 'Authentic Ethiopian cuisine with live music and traditional coffee ceremony.', phone: '+251-11-123-4567', hours: '8:00 AM - 10:00 PM', address: 'Bole Road, Addis Ababa' },
  { id: 'food-2', name: 'Kategna Restaurant', category: 'Ethiopian Cuisine', categoryId: 'food', rating: 4.7, reviews: 267, latitude: 9.0215, longitude: 38.7485, image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400', verified: true, description: 'High-quality traditional Ethiopian cuisine with extensive menu.', phone: '+251-11-667-2879', hours: '8:00 AM - 11:00 PM', address: 'Bole Medhane Alem, Addis Ababa' },
  { id: 'food-3', name: 'Gusto Trattoria', category: 'Italian', categoryId: 'food', rating: 4.5, reviews: 189, latitude: 9.025, longitude: 38.75, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', verified: true, description: 'Italian and Mediterranean fusion cuisine in a cozy setting.', phone: '+251-11-553-0444', hours: '11:00 AM - 10:00 PM', address: 'Kazanchis, Addis Ababa' },
  { id: 'food-4', name: 'Marcus Addis Restaurant & Sky Bar', category: 'Fine Dining', categoryId: 'food', rating: 4.2, reviews: 156, latitude: 9.025, longitude: 38.755, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400', verified: true, description: 'Premium dining with panoramic city views.', phone: '+251-11-555-0101', hours: '6:00 PM - 11:00 PM', address: 'Head Office Tower, 47th Floor, Addis Ababa' },
  { id: 'food-5', name: 'Arirang Korean Restaurant', category: 'Korean', categoryId: 'food', rating: 4.3, reviews: 112, latitude: 9.023, longitude: 38.749, image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', verified: true, description: 'Authentic Korean cuisine with BBQ and traditional dishes.', phone: '+251-11-618-1618', hours: '11:00 AM - 10:00 PM', address: 'Bole, Addis Ababa' },
  { id: 'food-6', name: 'Bait Al Mandi', category: 'Yemeni', categoryId: 'food', rating: 4.4, reviews: 134, latitude: 9.02, longitude: 38.751, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', verified: true, description: 'Authentic Yemeni and Middle Eastern cuisine.', phone: '+251-11-551-2345', hours: '10:00 AM - 11:00 PM', address: 'Bole, Addis Ababa' },
  { id: 'food-7', name: 'Little China Restaurant', category: 'Chinese', categoryId: 'food', rating: 4.1, reviews: 98, latitude: 9.026, longitude: 38.752, image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400', verified: true, description: 'Chinese cuisine with extensive dim sum and noodle options.', phone: '+251-11-554-4321', hours: '11:00 AM - 10:00 PM', address: 'Kazanchis, Addis Ababa' },
  { id: 'food-8', name: 'Sishu Restaurant', category: 'Burgers', categoryId: 'food', rating: 4.3, reviews: 145, latitude: 9.022, longitude: 38.748, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400', verified: true, description: 'Popular spot for burgers, sandwiches and comfort food.', phone: '+251-11-661-6116', hours: '8:00 AM - 10:00 PM', address: 'Bole, Addis Ababa' },
  { id: 'food-9', name: '2000 Habesha Cultural Restaurant', category: 'Ethiopian Cultural', categoryId: 'food', rating: 4.3, reviews: 312, latitude: 9.03, longitude: 38.74, image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400', verified: true, description: 'Live cultural music and dance performances with traditional cuisine.', phone: '+251-91-283-8383', hours: '9:00 AM - 12:00 AM', address: 'Namibia St, Addis Ababa' },
  { id: 'food-10', name: 'Cravings Restaurant & Bar', category: 'International', categoryId: 'food', rating: 4.6, reviews: 287, latitude: 9.021, longitude: 38.75, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400', verified: true, description: 'Modern international cuisine with extensive wine and cocktail menu.', phone: '+251-11-868-5353', hours: '11:00 AM - 11:00 PM', address: 'Bole, Addis Ababa' },

  // Cafes
  { id: 'cafe-1', name: 'Tomoca Coffee', category: 'Coffee Shop', categoryId: 'cafe', rating: 4.6, reviews: 234, latitude: 9.02, longitude: 38.75, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', verified: true, description: "Addis Ababa's iconic coffee shop since 1953.", phone: '+251-11-111-2498', hours: '6:00 AM - 10:00 PM', address: 'Wawel St, Addis Ababa' },
  { id: 'cafe-2', name: "Kaldi's Coffee", category: 'Coffee Shop', categoryId: 'cafe', rating: 4.2, reviews: 312, latitude: 9.022, longitude: 38.747, image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400', verified: true, description: "Ethiopia's largest coffee chain with modern ambiance.", hours: '6:00 AM - 10:00 PM', address: 'Bole, Addis Ababa' },
  { id: 'cafe-3', name: 'Garden of Coffee', category: 'Specialty Coffee', categoryId: 'cafe', rating: 4.8, reviews: 98, latitude: 9.021, longitude: 38.748, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', verified: true, description: 'Artisan coffee roastery focusing on sustainable beans.', phone: '+251-91-345-6789', hours: '7:00 AM - 9:00 PM', address: 'Bole, Addis Ababa' },
  { id: 'cafe-4', name: 'Mokarar Coffee', category: 'Coffee Shop', categoryId: 'cafe', rating: 4.5, reviews: 112, latitude: 9.025, longitude: 38.746, image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400', verified: true, description: 'Historic coffee shop serving premium Ethiopian beans.', phone: '+251-11-111-5678', hours: '6:00 AM - 9:00 PM', address: 'Piassa, Addis Ababa' },
  { id: 'cafe-5', name: 'Reboot Coffee', category: 'Coffee Shop', categoryId: 'cafe', rating: 4.8, reviews: 112, latitude: 9.024, longitude: 38.744, image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400', verified: true, description: 'Modern coffee shop with vibrant workspace atmosphere.', hours: '7:00 AM - 9:00 PM', address: '4 Kilo, Addis Ababa' },

  // Hotels
  { id: 'hotel-1', name: 'Sheraton Addis Hotel', category: 'Luxury Hotel', categoryId: 'hotel', rating: 4.8, reviews: 423, latitude: 9.017, longitude: 38.751, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400', verified: true, description: 'Iconic luxury hotel with stunning architecture and premium service.', phone: '+251-11-517-1717', hours: '24 hours', address: 'Taitu Street, Addis Ababa' },
  { id: 'hotel-2', name: 'Hilton Addis Ababa', category: 'Luxury Hotel', categoryId: 'hotel', rating: 4.6, reviews: 512, latitude: 9.025, longitude: 38.745, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', verified: true, description: 'Five-star luxury hotel with pools and gardens.', phone: '+251-11-517-0000', hours: '24 hours', address: 'Menelik II Ave, Addis Ababa' },
  { id: 'hotel-3', name: 'Hyatt Regency Addis Ababa', category: 'Luxury Hotel', categoryId: 'hotel', rating: 4.7, reviews: 345, latitude: 9.022, longitude: 38.752, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400', verified: true, description: 'Modern luxury hotel near Meskel Square.', phone: '+251-11-544-1234', hours: '24 hours', address: 'Meskel Square, Addis Ababa' },
  { id: 'hotel-4', name: 'Radisson Blu Hotel Addis Ababa', category: 'Business Hotel', categoryId: 'hotel', rating: 4.5, reviews: 298, latitude: 9.024, longitude: 38.748, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', verified: true, description: 'Premium business hotel with conference facilities.', phone: '+251-11-554-0000', hours: '24 hours', address: 'Kazanchis, Addis Ababa' },
  { id: 'hotel-5', name: 'Ethiopian Skylight Hotel', category: 'Luxury Hotel', categoryId: 'hotel', rating: 4.6, reviews: 267, latitude: 9.015, longitude: 38.755, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400', verified: true, description: 'Modern airport hotel with world-class amenities.', phone: '+251-11-558-0000', hours: '24 hours', address: 'Bole Airport, Addis Ababa' },

  // Health
  { id: 'health-1', name: 'Black Lion Hospital', category: 'General Hospital', categoryId: 'health', rating: 4.2, reviews: 187, latitude: 9.03, longitude: 38.74, image: 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400', verified: true, description: 'Leading public teaching hospital.', phone: '+251-11-551-3000', hours: '24 hours', address: 'King George VI Street, Addis Ababa' },
  { id: 'health-2', name: 'Nordic Medical Centre', category: 'Private Hospital', categoryId: 'health', rating: 4.5, reviews: 134, latitude: 9.021, longitude: 38.748, image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400', verified: true, description: 'Premium private medical services.', phone: '+251-11-554-9900', hours: '24 hours', address: 'Bole, Addis Ababa' },
  { id: 'health-3', name: 'Myungsung Christian Medical Center', category: 'Private Hospital', categoryId: 'health', rating: 4.6, reviews: 167, latitude: 9.02, longitude: 38.749, image: 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400', verified: true, description: 'Leading private hospital in Bole.', phone: '+251-11-618-9000', hours: '24 hours', address: 'Bole Medhane Alem, Addis Ababa' },

  // Shops
  { id: 'shop-1', name: 'Mercato - Addis Merkato', category: 'Market', categoryId: 'shop', rating: 4, reviews: 345, latitude: 9.035, longitude: 38.735, image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400', verified: true, description: "Africa's largest open-air market.", phone: '+251-96-372-7196', hours: '8:00 AM - 7:00 PM', address: 'Merkato, Addis Ababa' },
  { id: 'shop-2', name: 'Edna Mall', category: 'Shopping Mall', categoryId: 'shop', rating: 4.3, reviews: 890, latitude: 9.001, longitude: 38.784, image: 'https://images.unsplash.com/photo-1519567281023-e1262d182b8d?w=400', verified: true, description: 'Popular mall with Matti Cinema and gaming zone.', phone: '+251-11-661-6272', hours: '8:00 AM - 10:00 PM', address: 'Bole Medhane Alem, Addis Ababa' },

  // Nightlife
  { id: 'club-1', name: 'Club Illusion', category: 'Nightclub', categoryId: 'club', rating: 4.3, reviews: 156, latitude: 9.027, longitude: 38.754, image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400', verified: true, description: 'Long-standing club with electrifying atmosphere.', phone: '+251-91-127-2628', hours: '9:00 PM - 3:00 AM', address: 'Kazanchis, Addis Ababa' },
  { id: 'club-2', name: 'Wakanda Ultra Lounge', category: 'Lounge', categoryId: 'club', rating: 4.7, reviews: 134, latitude: 9.021, longitude: 38.749, image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400', verified: true, description: 'Ultra lounge with premium cocktails and VIP experience.', phone: '+251-93-001-1125', hours: '7:00 PM - 2:00 AM', address: 'Mickey Leland St, Addis Ababa' },

  // Tech
  { id: 'tech-1', name: 'iCog Labs', category: 'AI & Robotics', categoryId: 'tech', rating: 4.5, reviews: 67, latitude: 9.016, longitude: 38.77, image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400', verified: true, description: 'AI research lab developing intelligent systems.', phone: '+251-11-554-1234', hours: '9:00 AM - 6:00 PM', address: 'Bole Road, Addis Ababa' },
  { id: 'tech-2', name: 'Chapa Financial Technologies', category: 'Fintech', categoryId: 'tech', rating: 4.7, reviews: 89, latitude: 9.019, longitude: 38.765, image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400', verified: true, description: "Ethiopia's leading payment gateway.", phone: '+251-960-724-272', hours: '9:00 AM - 6:00 PM', address: 'Bole Subcity, Addis Ababa' },

  // Fuel
  { id: 'fuel-1', name: "TotalEnergies Bole Station", category: 'Fuel Station', categoryId: 'fuel', rating: 4, reviews: 45, latitude: 9.0215, longitude: 38.749, image: 'https://images.unsplash.com/photo-1597534458220-9fb4969f2df5?w=400', verified: true, description: 'Full-service fuel station with convenience store.', hours: '24 hours', address: 'Bole Road, Addis Ababa' },

  // Banks
  { id: 'bank-1', name: 'Commercial Bank of Ethiopia - Head Office', category: 'Bank', categoryId: 'finance', rating: 3.7, reviews: 145, latitude: 9.022, longitude: 38.752, image: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=400', verified: true, description: "Ethiopia's largest commercial bank.", phone: '+251-11-551-5000', hours: '8:00 AM - 5:00 PM', address: 'Meskel Square, Addis Ababa' },
  { id: 'bank-2', name: 'Dashen Bank - Head Office', category: 'Bank', categoryId: 'finance', rating: 4.6, reviews: 98, latitude: 9.02, longitude: 38.748, image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400', verified: true, description: "One of Ethiopia's largest private banks.", phone: '+251-11-552-4111', hours: '8:00 AM - 5:00 PM', address: 'Bole, Addis Ababa' },

  // Gyms
  { id: 'gym-1', name: 'Vigor Fitness Laphto Mall', category: 'Fitness Center', categoryId: 'gym', rating: 4.8, reviews: 156, latitude: 9.021, longitude: 38.747, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', verified: true, description: 'Premium fitness center with pool and spa.', phone: '+251-11-552-8800', hours: '6:00 AM - 10:00 PM', address: 'Laphto Mall, Old Airport, Addis Ababa' },
  { id: 'gym-2', name: 'SweatBox Addis', category: 'Fitness Studio', categoryId: 'gym', rating: 4.6, reviews: 87, latitude: 9.019, longitude: 38.749, image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400', verified: true, description: 'High-intensity group classes and personal training.', phone: '+251-910-657-999', hours: '5:00 AM - 10:00 PM', address: 'Bole Subcity, Addis Ababa' },

  // Education
  { id: 'edu-1', name: 'Addis Ababa University', category: 'University', categoryId: 'edu', rating: 4.3, reviews: 423, latitude: 9.046, longitude: 38.755, image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400', verified: true, description: "Ethiopia's oldest and largest university.", phone: '+251-11-123-4567', hours: '8:00 AM - 5:00 PM', address: 'Sidist Kilo, Addis Ababa' },
  { id: 'edu-2', name: 'International Community School of Addis', category: 'International School', categoryId: 'edu', rating: 4.7, reviews: 89, latitude: 9.025, longitude: 38.755, image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', verified: true, description: 'Prestigious IB and American curriculum school.', phone: '+251-11-661-7171', hours: '8:00 AM - 4:00 PM', address: 'Bole, Addis Ababa' },
];

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(BusinessesService);

  console.log(`🌱 Seeding ${SEED_BUSINESSES.length} businesses...`);
  const count = await service.clearAndSeed(SEED_BUSINESSES);
  console.log(`✅ Seeded ${count} businesses successfully!`);

  await app.close();
}

bootstrap().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
