export class Utils {

    static generateCode(length) {
        var randomChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        var result = '';
        for ( var i = 0; i < length; i++ ) {
            result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
        }
        return result;
    }
}