import Address from "../../models/addresSchema.js"
import User from "../../models/userSchema.js"
import Category from "../../models/categorySchema.js";
import Product from "../../models/productSchema.js"

const loadAddress = async (req, res) => {
    try {
        const id = req.session.passport?.user || req.session.user

        const user = await User.findById(id)

        const addresses = await Address.findOne({ userId: id })
        const categories = await Category.find()

        res.render("userAddress",
            {
                title: "Shad Electro",
                user,
                addresses: addresses || { address: [] },
                categories
            })

    } catch (error) {
        console.error("Error at Address", error)
        res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}

const addAddress = async (req, res) => {
    try {

        const userId = req.session.passport?.user || req.session.user;

        const { addressTitle, name, address, landMark, city, state, pinCode, country, phone, addressType = "shipping", isDefault,
            isBilling, } = req.body

        const addressDetails = {
            addressType,
            address,
            addressTitle,
            landMark,
            city,
            country,
            state,
            pinCode,
            phone,
            isDefault: isDefault || false,
            isBilling: isBilling || false,
        }

        const saveAddress = await Address.findOneAndUpdate({ userId }, { $push: { address: addressDetails } }, { upsert: true, new: true })


        if (!saveAddress) return res.json({ success: false, message: 'Failed to save address' });

        console.log("updatedd");

        res.json({ success: true, message: 'Address saved successfully' });


    } catch (error) {
        console.error("Error at Address save:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}


const editAddress = async (req, res) => {
    try {

        const { id } = req.params
        const userId = req.session.passport?.user || req.session.user
        const { title, address, landMark, city, state, pinCode, phone, addressType } = req.body
        console.log(req.body)
        const saveAddress = await Address.findOne({ userId });
        
        


        let updateAddress = saveAddress.address.id(id)
        if (!updateAddress) return res.json({ success: false, message: "User address is not found" });
        

        updateAddress.title = title
        updateAddress.address = address
        updateAddress.landMark = landMark
        updateAddress.city = city
        updateAddress.state = state
        updateAddress.pinCode = pinCode
        updateAddress.phone = phone
        updateAddress.addressType = addressType || "new Type"

        await saveAddress.save()
        res.json({ success: true, message: "Address updated successfully" })

    } catch (error) {
        console.error("Error at editAddress", error)
        res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}


const deleteAddress = async (req, res) => {
    try {

        const { id } = req.params
        const userId = req.session.passport?.user || req.session.user
        await Address.updateOne({ userId }, { $pull: { address: { _id: id } } });

        res.json({ success: true, message: "Address deleted successfully" });

    } catch (error) {
        console.error("Error at deleteAddress", error)
        res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}


export default { loadAddress, addAddress, editAddress, deleteAddress, }