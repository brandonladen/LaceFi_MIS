const { db } = require('../common/initializer');
const moment = require('moment');
const logger = require('../common/logger');

class SubscriptionService {
  getAllSubscribers(filters = {}) {
    try {
      let query = 'SELECT * FROM subscribers WHERE 1=1';
      const params = [];

      if (filters.routerName) {
        query += ' AND router_name = ?';
        params.push(filters.routerName);
      }
      if (filters.subscriptionType) {
        query += ' AND subscription_type = ?';
        params.push(filters.subscriptionType);
      }

      query += ' ORDER BY payment_date DESC';
      return db.prepare(query).all(...params);
    } catch (error) {
      logger.error('Error fetching subscribers:', error);
      throw error;
    }
  }

  createSubscription(data) {
    try {
      const { 
        name, phone_number, payment_code, amount, 
        payment_date, router_name, router_location 
      } = data;
  
      const subscription_type = parseInt(amount) === 150 ? 'weekly' : 'monthly';
      const startMoment = moment(payment_date);
      const subscription_end_date = subscription_type === 'weekly' 
        ? startMoment.clone().add(7, 'days')
        : startMoment.clone().add(1, 'month');
  
      const insertSubscriber = db.prepare(`
        INSERT INTO subscribers (
          name, phone_number, payment_code, amount, 
          payment_date, subscription_end_date, subscription_type,
          router_name, router_location
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
  
      const insertPayment = db.prepare(`
        INSERT INTO payments (payment_code, amount, payment_date, subscriber_id)
        VALUES (?, ?, ?, ?)
      `);
  
      db.transaction(() => {
        const subscriberInfo = insertSubscriber.run(
          name, phone_number, payment_code, amount,
          startMoment.format('YYYY-MM-DD HH:mm:ss'),
          subscription_end_date.format('YYYY-MM-DD HH:mm:ss'),
          subscription_type, router_name, router_location
        );
  
        insertPayment.run(
          payment_code,
          amount,
          startMoment.format('YYYY-MM-DD HH:mm:ss'),
          subscriberInfo.lastInsertRowid
        );
      })();
  
      return true;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }
  

  updateSubscription(id, data) {
    try {
      const { 
        name, phone_number, payment_code, amount,
        payment_date, router_name, router_location 
      } = data;

      // Determine subscription type and calculate end date
      const subscription_type = parseInt(amount) === 150 ? 'weekly' : 'monthly';
      const startMoment = moment(payment_date);
      const subscription_end_date = subscription_type === 'weekly'
        ? startMoment.clone().add(7, 'days')
        : startMoment.clone().add(1, 'month');

      const updateSubscriber = db.prepare(`
        UPDATE subscribers 
        SET name = ?, phone_number = ?, payment_code = ?, 
            amount = ?, payment_date = ?, subscription_end_date = ?,
            subscription_type = ?, router_name = ?, router_location = ?
        WHERE id = ?
      `);

      const result = updateSubscriber.run(
        name, phone_number, payment_code, amount,
        startMoment.format('YYYY-MM-DD HH:mm:ss'),
        subscription_end_date.format('YYYY-MM-DD HH:mm:ss'),
        subscription_type, router_name, router_location, id
      );

      return result.changes > 0;
    } catch (error) {
      logger.error('Error updating subscription:', error);
      throw error;
    }
  }

  deleteSubscription(id) {
    try {
      return db.transaction(() => {
        const deletePayments = db.prepare('DELETE FROM payments WHERE subscriber_id = ?');
        deletePayments.run(id);

        const deleteSubscriber = db.prepare('DELETE FROM subscribers WHERE id = ?');
        const result = deleteSubscriber.run(id);
        
        return result.changes > 0;
      })();
    } catch (error) {
      logger.error('Error deleting subscription:', error);
      throw error;
    }
  }

  getFinancialSummary() {
    try {
        const totalRevenue = db.prepare('SELECT SUM(amount) as total FROM payments').get();
        return {
            total: totalRevenue.total || 0,
            weekly: db.prepare(`
                SELECT COUNT(*) as count, SUM(amount) as total 
                FROM subscribers 
                WHERE subscription_type = 'weekly'
            `).get(),
            monthly: db.prepare(`
                SELECT COUNT(*) as count, SUM(amount) as total 
                FROM subscribers 
                WHERE subscription_type = 'monthly'
            `).get()
        };
    } catch (error) {
        logger.error('Error getting financial summary:', error);
        throw error;
    }
}

}

module.exports = new SubscriptionService();