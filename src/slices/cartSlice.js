import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  totalQuantity: 0,
  totalPrice: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // 1. New Action: Allows Navbar to swap the entire cart when user changes
    setCart: (state, action) => {
      state.items = action.payload.items || [];
      state.totalQuantity = action.payload.totalQuantity || 0;
      state.totalPrice = action.payload.totalPrice || 0;
    },

    addItem: (state, action) => {
      const newItem = action.payload;
      const existingItem = state.items.find((item) => item.product_id === newItem.product_id);
      
      if (!existingItem) {
        state.items.push({
          product_id: newItem.product_id,
          product_name: newItem.product_name,
          image_url: newItem.image_url,
          selling_unit_price: Number(newItem.selling_unit_price),
          quantity: 1,
        });
        state.totalQuantity++;
      } else {
        existingItem.quantity++;
        state.totalQuantity++;
      }

      state.totalPrice = state.items.reduce(
        (total, item) => total + Number(item.selling_unit_price) * item.quantity, 0
      );
    },

    removeItem: (state, action) => {
      const id = action.payload;
      const existingItem = state.items.find((item) => item.product_id === id);

      if (existingItem) {
        state.totalQuantity -= existingItem.quantity;
        state.items = state.items.filter((item) => item.product_id !== id);
      }

      state.totalPrice = state.items.reduce(
        (total, item) => total + Number(item.selling_unit_price) * item.quantity, 0
      );
    },

    updateQuantity: (state, action) => {
        const { id, quantity } = action.payload;
        const item = state.items.find(item => item.product_id === id);
        
        if(item){
            const diff = quantity - item.quantity;
            item.quantity = quantity;
            state.totalQuantity += diff;
        }

        state.totalPrice = state.items.reduce(
            (total, item) => total + Number(item.selling_unit_price) * item.quantity, 0
        );
    },

    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
      state.totalPrice = 0;
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart, setCart } = cartSlice.actions;
export default cartSlice.reducer;