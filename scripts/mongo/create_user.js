db.createUser(
  {
    user: "test",
    pwd: "test",
    roles: [
      {
        role: "root",
        db: "hsl_bike_app"
      }
    ]
  }
);