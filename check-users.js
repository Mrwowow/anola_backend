const mongoose = require('mongoose');
const config = require('./src/config/config');

mongoose.connect(config.mongoURI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    const totalUsers = await User.countDocuments();
    console.log(`\nTotal users in database: ${totalUsers}`);
    
    const usersByType = await User.aggregate([
      { $group: { _id: '$userType', count: { $sum: 1 } } }
    ]);
    console.log('\nUsers by type:');
    usersByType.forEach(item => console.log(`  ${item._id}: ${item.count}`));
    
    const usersByStatus = await User.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('\nUsers by status:');
    usersByStatus.forEach(item => console.log(`  ${item._id}: ${item.count}`));
    
    const sampleUser = await User.findOne().select('email userType status profile');
    console.log('\nSample user:');
    console.log(JSON.stringify(sampleUser, null, 2));
    
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
