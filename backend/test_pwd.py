from passlib.context import CryptContext
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Test with the existing hash
hash1 = "$2b$12$tfvtI/fvfZEKTUBiGkOsTulfvfZEKTUBiGkOsTu"
print("verify varun:", pwd.verify("varun", hash1))

# New hash
h2 = pwd.hash("varun")
print("new hash:", h2)
print("verify new:", pwd.verify("varun", h2))
