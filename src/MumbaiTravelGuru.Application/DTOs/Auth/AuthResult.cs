namespace MumbaiTravelGuru.Application.DTOs.Auth
{
    public class AuthResult
    {
        public bool Succeeded { get; set; }
        public string Token { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public UserDto? User { get; set; }
        public string Error { get; set; } = string.Empty;
    }
}
