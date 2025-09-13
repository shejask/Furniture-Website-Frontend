'use client'

import { ref, get } from 'firebase/database';
import { database } from './config';

export interface CityShippingRate {
  name: string;
  price: number;
}

export interface StateShippingRate {
  state: string;
  cities: CityShippingRate[];
}

export interface CountryShippingRate {
  country: string;
  states: StateShippingRate[];
}

export interface ShippingData {
  [countryName: string]: CountryShippingRate;
}

// Get shipping rates from Firebase
export const getShippingRates = async (): Promise<ShippingData> => {
  try {
    const shippingRef = ref(database, 'shipping');
    const snapshot = await get(shippingRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log('Shipping data from Firebase:', data);
      return data;
    }
    
    return {};
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    return {};
  }
};

// Get shipping cost for a specific city and state
export const getShippingCostForCity = async (city: string, state: string, country: string = 'India'): Promise<number> => {
  try {
    const shippingData = await getShippingRates();
    
    if (shippingData[country]) {
      const countryData = shippingData[country];
      const stateData = countryData.states.find(s => 
        s.state.toLowerCase() === state.toLowerCase()
      );
      
      if (stateData) {
        const cityData = stateData.cities.find(c => 
          c.name.toLowerCase() === city.toLowerCase()
        );
        
        if (cityData) {
          console.log(`Found shipping rate for ${city}, ${state}: ₹${cityData.price}`);
          return cityData.price;
        }
      }
    }
    
    console.log(`No shipping rate found for ${city}, ${state}, ${country} - using default rate`);
    return 50; // Default shipping cost
  } catch (error) {
    console.error('Error getting shipping cost for city:', error);
    return 50;
  }
};

// Get shipping cost for a specific city (synchronous version with cached data)
export const getShippingCostForCitySync = (city: string, state: string, shippingData: ShippingData, country: string = 'India'): number => {
  if (!shippingData || Object.keys(shippingData).length === 0) {
    return 50;
  }
  
  if (shippingData[country]) {
    const countryData = shippingData[country];
    const stateData = countryData.states.find(s => 
      s.state.toLowerCase() === state.toLowerCase()
    );
    
    if (stateData) {
      const cityData = stateData.cities.find(c => 
        c.name.toLowerCase() === city.toLowerCase()
      );
      
      if (cityData) {
        return cityData.price;
      }
    }
  }
  
  // Try to find a similar city name or use state-based pricing
  if (shippingData[country]) {
    const countryData = shippingData[country];
    const stateData = countryData.states.find(s => 
      s.state.toLowerCase() === state.toLowerCase()
    );
    
    if (stateData) {
      // Try partial matching
      const similarCity = stateData.cities.find(c => 
        c.name.toLowerCase().includes(city.toLowerCase()) || 
        city.toLowerCase().includes(c.name.toLowerCase())
      );
      
      if (similarCity) {
        return similarCity.price;
      }
      
      // If no similar city found, use average price for the state
      const avgPrice = stateData.cities.reduce((sum, c) => sum + c.price, 0) / stateData.cities.length;
      return Math.round(avgPrice);
    }
  }
  
  return 50; // Default shipping cost
};
