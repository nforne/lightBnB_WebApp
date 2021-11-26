const properties = require('./json/properties.json');
const users = require('./json/users.json');

const { Pool } = require('pg');
const { max } = require('pg/lib/defaults');
const config = {
  user: 'labber',
  password: 'labber',
  host: 'localhost',
  database: 'lightbnb'
};
const pg = new Pool(config);

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
// const getUserWithEmail = function(email) {
//   let user;
//   for (const userId in users) {
//     user = users[userId];
//     if (user.email.toLowerCase() === email.toLowerCase()) {
//       break;
//     } else {
//       user = null;
//     }
//   }
//   return Promise.resolve(user);
// }

const getUserWithEmail = (email) => {
  let qstring = `SELECT id, name, email, password FROM users
  WHERE email = $1 ;`;
  let values = [email];
  return pg
    .query(qstring, values)
    .then((res) => res.rows[0] ? res.rows[0] : null)
    .catch((err) => {
      console.log(err.message);
      });
}



exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */

// const getUserWithId = function(id) {
//   return Promise.resolve(users[id]);
// }

const getUserWithId = (id) => {
  let qstring = `SELECT id, name, email, password FROM users
  WHERE id = $1 ;`;
  let values = [id];
  return pg
    .query(qstring, values)
    .then((res) => res.rows[0] ? res.rows[0] : null)
    .catch((err) => {
      console.log(err.message);
      });
}

exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
// const addUser =  function(user) {
//   const userId = Object.keys(users).length + 1;
//   user.id = userId;
//   users[userId] = user;
//   return Promise.resolve(user);
// }   

const addUser = (user) => {
 let qstring = `INSERT INTO users (name, email , password ) 
 VALUES ( $1 , $2 , $3 ) RETURNING *;`
 let values = [user.name, user.email, user.password]
 return pg
  .query(qstring, values)
  .then((res) => res.rows[0] ? res.rows[0] : null)
  .catch((err) => {
    console.log(err.message);
    });
};

exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
// const getAllReservations = function(guest_id, limit = 10) {
//   return getAllProperties(null, 2);
// }

const getAllReservations = function(guest_id, limit = 10) {

  let qstring = `SELECT properties.*, reservations.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  AND reservations.end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT 10;`;
  let values = [guest_id];
  return pg
    .query(qstring, values)
    .then((res) => res.rows[0] ? res.rows : null)
    .catch((err) => {
      console.log(err.message);
      });
}


exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
// const getAllProperties = function(options, limit = 10) {
//   const limitedProperties = {};
//   for (let i = 1; i <= limit; i++) {
//     limitedProperties[i] = properties[i];
//   }
//   return Promise.resolve(limitedProperties);
// }

const getAllProperties = (options, limit = 10) => {

  // potential structure of options object
  /*{
    city,
    owner_id,
    minimum_price_per_night,
    maximum_price_per_night,
    minimum_rating;
  }*/

 // 1
 const queryParams = [];
 // 2
 let queryString = `
 SELECT properties.*, avg(property_reviews.rating) as average_rating
 FROM properties
 JOIN property_reviews ON properties.id = property_id`;

 // 3
 if (options.city && options.owner_id) {
   queryParams.push(`%${options.city}%`);
   queryParams.push(`${options.owner_id}`);
   queryString += ` WHERE city LIKE $${queryParams.length - 1} 
                   AND properties.owner_id = $${queryParams.length}`;
 } else if (options.city) {

  queryParams.push(`%${options.city}%`);
  queryString += ` WHERE city LIKE $${queryParams.length - 1}`;              

 }

 
// additions


if (options.minimum_price_per_night && options.maximum_price_per_night && options.minimum_rating) {

  queryParams.push(`${options.minimum_rating}`);
  queryParams.push(`${options.minimum_price_per_night}`);
  queryParams.push(`${options.maximum_price_per_night}`);
  queryString += ` HAVING avg(property_reviews.rating) >= $${queryParams.length - 2} 
                  AND properties.price_per_night >= $${queryParams.length - 1} 
                  AND properties.price_per_night <= $${queryParams.length}`;
                  console.log(queryString);

} else if (options.minimum_price_per_night && options.minimum_rating) {
  queryParams.push(`${options.minimum_rating}`);
  queryParams.push(`${options.minimum_price_per_night}`);  
  queryString += ` HAVING avg(property_reviews.rating) >= $${queryParams.length - 1} 
                  AND  properties.price_per_night >= $${queryParams.length}`;
                  console.log(queryString);

} else if (options.maximum_price_per_night && options.minimum_rating) {
  queryParams.push(`${options.minimum_rating}`);
  queryParams.push(`${options.maximum_price_per_night}`);
  queryString += ` HAVING avg(property_reviews.rating) >= $${queryParams.length - 1}          
                  AND properties.price_per_night <= $${queryParams.length}`;
                  console.log(queryString);

} else if (options.minimum_price_per_night && options.maximum_price_per_night) {
  queryParams.push(`${options.minimum_price_per_night}`);
  queryParams.push(`${options.maximum_price_per_night}`);
  queryString += ` HAVING properties.price_per_night >= $${queryParams.length - 1} 
                  AND properties.price_per_night <= $${queryParams.length}`;
                  console.log(queryString);

} else if (options.minimum_rating) {
  queryParams.push(`${options.minimum_rating}`);  
  queryString += ` HAVING avg(property_reviews.rating) >= $${queryParams.length}`;
  console.log(queryString);    

} else if (options.minimum_price_per_night) {
  queryParams.push(`${options.minimum_price_per_night}`);
  queryString += ` HAVING properties.price_per_night >= $${queryParams.length}`;
  console.log(queryString); 

} else if (options.maximum_price_per_night) {

  queryParams.push(`${options.maximum_price_per_night}`);
  queryString += ` HAVING properties.price_per_night <= $${queryParams.length}`;
  console.log(queryString); 

}
                  
 // 4
 queryParams.push(limit);
 queryString += `
 GROUP BY properties.id
 ORDER BY cost_per_night
 LIMIT $${queryParams.length};`;

 // 5
console.log('//----------------------------------//////////////////////////////////////////////////---------------')
console.log(queryString, queryParams);

 // 6
 return pg.query(queryString, queryParams).then((res) => res.rows);

};

exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
// const addProperty = function(property) {
//   const propertyId = Object.keys(properties).length + 1;
//   property.id = propertyId;
//   properties[propertyId] = property;
//   return Promise.resolve(property);
// }

const addProperty = (property) => {
  let qstring = `INSERT INTO  properties (
    owner_id ,
    title ,
    description ,
    thumbnail_photo_url ,
    cover_photo_url ,
    cost_per_night ,
    parking_spaces ,
    number_of_bathrooms ,
    number_of_bedrooms ,
    country ,
    street ,
    city ,
    province ,
    post_code )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *;`
  let values = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms,
    property.country,
    property.street,
    property.city,
    property.province,
    property.post_code
  ];
return pg
  .query(qstring, values)
  .then((res) => res.rows[0] ? res.rows[0] : null)
  .catch((err) => {
    console.log(err.message);
    });
}

exports.addProperty = addProperty;
