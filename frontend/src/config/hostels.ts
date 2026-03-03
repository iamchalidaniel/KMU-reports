export const HOSTELS = ['V Hostel', 'W Hostel', 'X Hostel', 'Y Hostel', 'Z Hostel'];

export const FLOORS = [1, 2, 3, 4];

export const APARTMENTS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];

export const ROOMS = ['A', 'B'];

/**
 * Validates a room code according to KMU format: [Hostel][Floor][Apartment][Room]
 * Example: Z101B or Y402A
 */
export const validateRoomCode = (code: string): boolean => {
    const regex = /^[V-Z][1-4](0[1-9]|1[0-1])[A-B]$/;
    return regex.test(code.toUpperCase());
};

/**
 * Generates a descriptive room string from a code
 * Example: Z101B -> Z Hostel, Floor 1, Apt 01, Room B
 */
export const parseRoomCode = (code: string) => {
    if (!validateRoomCode(code)) return null;

    const hostel = code[0].toUpperCase();
    const floor = code[1];
    const apt = code.substring(2, 4);
    const room = code[4].toUpperCase();

    return {
        hostel: `${hostel} Hostel`,
        floor,
        apartment: apt,
        room
    };
};
