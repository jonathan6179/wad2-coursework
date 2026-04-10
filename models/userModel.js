// models/userModel.js
import { usersDb } from "./_db.js";
import bcrypt from "bcrypt";

const saltRounds = 10;

export const UserModel = {
    async create(user) {
        // Hash password if provided (registration), leave other fields as-is (seed)
        if (user.password) {
            const hash = await bcrypt.hash(user.password, saltRounds);
            return usersDb.insert({ ...user, password: hash });
        }
        return usersDb.insert(user);
    },
    async findByEmail(email) {
        return usersDb.findOne({ email });
    },
    async findById(id) {
        return usersDb.findOne({ _id: id });
    },
    async findAll() {
        return usersDb.find({});
    },
    async updateRole(id, role) {
        await usersDb.update({ _id: id }, { $set: { role } });
        return this.findById(id);
    },
    async remove(id) {
        return usersDb.remove({ _id: id });
    },
};