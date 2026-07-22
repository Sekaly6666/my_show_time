
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/my_show_time');
  const db = mongoose.connection;
  
  const notifications = await db.collection('notifications').find({}).toArray();
  console.log(`Updating ${notifications.length} notifications...`);
  
  for (const n of notifications) {
    let category = 'system';
    const title = (n.title || '').toLowerCase();
    if (title.includes('réservation') || title.includes('billet') || title.includes('reservé')) {
      category = 'booking';
    } else if (title.includes('avis') || title.includes('note')) {
      category = 'review';
    } else if (title.includes('favoris')) {
      category = 'favorite';
    }
    
    await db.collection('notifications').updateOne({ _id: n._id }, { $set: { category } });
  }
  
  console.log('Migration complete!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
