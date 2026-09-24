using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SocialSport.Api.DTOs.Sport;
using SocialSport.Api.Services.Interfaces;

namespace SocialSport.Api.Controllers
{
    [Route("api/v1/sports")]
    [ApiController]
    public class SportsController : ControllerBase
    {
        private readonly ISportService _sportService;

        public SportsController(ISportService sportService)
        {
            _sportService = sportService;
        }

        [HttpGet]
        public async Task<ActionResult<List<SportDto>>> GetAll()
        {
            return Ok(await _sportService.GetAllAsync());
        }
    }
}
