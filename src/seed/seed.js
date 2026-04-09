/**
 * Seeds realistic demo data (users, volunteers, SOS alerts, trips, recordings).
 * Run: npm run seed  (requires MongoDB and .env)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const User = require('../models/User');
const VolunteerProfile = require('../models/VolunteerProfile');
const SOSAlert = require('../models/SOSAlert');
const Trip = require('../models/Trip');
const EmergencyRecording = require('../models/EmergencyRecording');
const { ROLES, ALERT_STATUS, VERIFICATION_STATUS } = require('../config/constants');

const uploadsRoot = path.join(__dirname, '../../uploads');
const baseUrl = process.env.BASE_URL || 'http://localhost:4000';

function ensureUploadPlaceholders() {
  ['faces', 'drivers', 'emergency'].forEach((sub) => {
    const dir = path.join(uploadsRoot, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
  const stub = Buffer.from('demo-seed-file');
  const files = [
    ['faces', 'seed-volunteer-1.jpg'],
    ['faces', 'seed-volunteer-2.jpg'],
    ['drivers', 'seed-driver-1.jpg'],
    ['emergency', 'seed-emergency-1.webm'],
    ['emergency', 'seed-emergency-2.m4a'],
  ];
  files.forEach(([sub, name]) => {
    fs.writeFileSync(path.join(uploadsRoot, sub, name), stub);
  });
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Set MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected. Clearing collections...');

  await Promise.all([
    EmergencyRecording.deleteMany({}),
    Trip.deleteMany({}),
    SOSAlert.deleteMany({}),
    VolunteerProfile.deleteMany({}),
    User.deleteMany({}),
  ]);

  ensureUploadPlaceholders();

  const stub = Buffer.from('demo-seed-file');
  const pass = 'DemoPass123!';

  const uPriya = await User.create({
    email: 'priya.sharma@demo.in',
    passwordHash: await User.hashPassword(pass),
    name: 'Priya Sharma',
    phone: '+91 98765 43210',
    role: ROLES.USER,
  });

  const uAnjali = await User.create({
    email: 'anjali.verma@demo.in',
    passwordHash: await User.hashPassword(pass),
    name: 'Anjali Verma',
    phone: '+91 98102 33445',
    role: ROLES.USER,
  });

  const vMeera = await User.create({
    email: 'meera.krishnan@demo.in',
    passwordHash: await User.hashPassword(pass),
    name: 'Meera Krishnan',
    phone: '+91 99887 76655',
    role: ROLES.VOLUNTEER,
  });

  const vSana = await User.create({
    email: 'sana.patel@demo.in',
    passwordHash: await User.hashPassword(pass),
    name: 'Sana Patel',
    phone: '+91 91234 55667',
    role: ROLES.VOLUNTEER,
  });

  await VolunteerProfile.create({
    user: vMeera._id,
    aadhaarMock: 'XXXX-XXXX-4521',
    faceImageUrl: `${baseUrl}/uploads/faces/seed-volunteer-1.jpg`,
    address: {
      line1: '12th Cross, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    },
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
  });

  await VolunteerProfile.create({
    user: vSana._id,
    aadhaarMock: 'XXXX-XXXX-8890',
    faceImageUrl: `${baseUrl}/uploads/faces/seed-volunteer-2.jpg`,
    address: {
      line1: 'Near City Market',
      city: 'Mysuru',
      state: 'Karnataka',
      pincode: '570001',
    },
    verificationStatus: VERIFICATION_STATUS.PENDING,
  });

  // Bengaluru CBD — alerts within ~3 km of a volunteer search point (MG Road area)
  const hubLat = 12.975;
  const hubLng = 77.599;

  await SOSAlert.create({
    user: uPriya._id,
    location: { type: 'Point', coordinates: [hubLng + 0.005, hubLat + 0.003] },
    occurredAt: new Date(Date.now() - 15 * 60 * 1000),
    status: ALERT_STATUS.PENDING,
    notes: 'Demo: feeling unsafe near metro exit',
    locationName: 'MG Road area, Bengaluru',
  });

  await SOSAlert.create({
    user: uAnjali._id,
    location: { type: 'Point', coordinates: [hubLng - 0.008, hubLat + 0.002] },
    occurredAt: new Date(Date.now() - 40 * 60 * 1000),
    status: ALERT_STATUS.ACCEPTED,
    acceptedBy: vMeera._id,
    acceptedAt: new Date(Date.now() - 35 * 60 * 1000),
    notes: 'Demo: accepted alert',
    locationName: 'Cubbon Park vicinity, Bengaluru',
  });

  await Trip.create({
    user: uPriya._id,
    vehiclePlate: 'KA01AB1234',
    driverImageUrl: `${baseUrl}/uploads/drivers/seed-driver-1.jpg`,
    recordedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    destinationNote: 'Airport — Uber',
  });

  await EmergencyRecording.create({
    user: uAnjali._id,
    fileUrl: `${baseUrl}/uploads/emergency/seed-emergency-1.webm`,
    mimeType: 'video/webm',
    originalName: 'cab-incident.webm',
    sizeBytes: stub.length,
    durationSec: 42,
    label: 'Late night cab — audio note',
  });

  await EmergencyRecording.create({
    user: uPriya._id,
    fileUrl: `${baseUrl}/uploads/emergency/seed-emergency-2.m4a`,
    mimeType: 'audio/mp4',
    originalName: 'voice-note.m4a',
    sizeBytes: stub.length,
    durationSec: 18,
    label: 'Street harassment — quick capture',
  });

  console.log('\n--- Seed complete ---');
  console.log('All accounts use password:', pass);
  console.log('\nUsers:');
  console.log('  priya.sharma@demo.in (user)');
  console.log('  anjali.verma@demo.in (user)');
  console.log('Volunteers:');
  console.log('  meera.krishnan@demo.in (verified)');
  console.log('  sana.patel@demo.in (pending)');
  console.log('\nNearby SOS test: GET /api/alerts/nearby?latitude=' + hubLat + '&longitude=' + hubLng);
  console.log('(Use volunteer JWT — expect open alerts within 3 km)\n');

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
